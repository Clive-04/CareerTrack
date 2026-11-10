import asyncio
import unittest

import jwt
from fastapi import HTTPException, Response
from pydantic import ValidationError

from app.core.config import Settings
from app.core.middleware import CookieCSRFMiddleware, LimitRequestBodyMiddleware
from app.core.rate_limit import SlidingWindowLimiter, private_identifier
from app.core.security import create_access_token, decode_access_token
from app.routers.auth import set_session_cookie
from app.schemas.application import ApplicationCreate
from app.schemas.auth import UserLogin, UserRegister
from app.schemas.resume import ResumeCreate
from app.schemas.skill import SkillCreate


class SecurityTests(unittest.TestCase):
    def test_access_token_contains_and_validates_required_claims(self):
        payload = decode_access_token(create_access_token("user-123"))

        self.assertEqual(payload["sub"], "user-123")
        self.assertEqual(payload["type"], "access")
        for claim in ["exp", "iat", "nbf", "iss", "aud", "jti"]:
            self.assertIn(claim, payload)

    def test_expired_access_token_is_rejected(self):
        token = create_access_token("user-123", expires_minutes=-1)

        with self.assertRaises(jwt.ExpiredSignatureError):
            decode_access_token(token)

    def test_weak_jwt_secret_is_rejected(self):
        with self.assertRaises(ValidationError):
            Settings(
                _env_file=None,
                DATABASE_URL="sqlite://",
                JWT_SECRET_KEY="too-short",
            )

    def test_production_requires_https_and_deployed_host(self):
        with self.assertRaises(ValidationError):
            Settings(
                _env_file=None,
                ENVIRONMENT="production",
                DATABASE_URL="sqlite://",
                JWT_SECRET_KEY="a-secure-random-secret-that-is-long-enough",
                FRONTEND_ORIGINS="http://localhost:3000",
                ALLOWED_HOSTS="localhost",
                FORCE_HTTPS=False,
            )

        with self.assertRaises(ValidationError):
            Settings(
                _env_file=None,
                ENVIRONMENT="production",
                DATABASE_URL="sqlite://",
                JWT_SECRET_KEY="a-secure-random-secret-that-is-long-enough",
                FRONTEND_ORIGINS="https://careertrack.example",
                ALLOWED_HOSTS="api.careertrack.example",
                FORCE_HTTPS=True,
                AUTH_COOKIE_SECURE=False,
            )

    def test_s3_storage_requires_complete_https_configuration(self):
        base = {
            "_env_file": None,
            "DATABASE_URL": "sqlite://",
            "JWT_SECRET_KEY": "a-secure-random-secret-that-is-long-enough",
            "RESUME_STORAGE_BACKEND": "s3",
        }
        with self.assertRaises(ValidationError):
            Settings(**base)
        with self.assertRaises(ValidationError):
            Settings(
                **base,
                S3_ENDPOINT_URL="http://storage.example.test",
                S3_REGION="test-region",
                S3_ACCESS_KEY_ID="access",
                S3_SECRET_ACCESS_KEY="secret",
                S3_BUCKET="resumes",
            )

        configured = Settings(
            **base,
            S3_ENDPOINT_URL="https://storage.example.test",
            S3_REGION="test-region",
            S3_ACCESS_KEY_ID="access",
            S3_SECRET_ACCESS_KEY="secret",
            S3_BUCKET="resumes",
        )
        self.assertEqual(configured.RESUME_STORAGE_BACKEND, "s3")

    def test_registration_requires_stronger_bcrypt_safe_password(self):
        with self.assertRaises(ValidationError):
            UserRegister(
                email="user@example.com",
                password="shortpass",
                first_name="Test",
                last_name="User",
            )

        with self.assertRaises(ValidationError):
            UserRegister(
                email="user@example.com",
                password="Aa!" + "a" * 70,
                first_name="Test",
                last_name="User",
            )

        for weak_password in [
            "lowercase-only!",
            "UPPERCASE-ONLY!",
            "NoSpecialCharacter",
        ]:
            with self.subTest(password=weak_password):
                with self.assertRaises(ValidationError):
                    UserRegister(
                        email="user@example.com",
                        password=weak_password,
                        first_name="Test",
                        last_name="User",
                    )

        user = UserRegister(
            email="user@example.com",
            password="Correct-password",
            first_name="Test",
            last_name="User",
        )
        self.assertEqual(user.password, "Correct-password")

    def test_authentication_input_is_normalized_and_extra_fields_are_rejected(self):
        login = UserLogin(email="USER@Example.COM", password="anything")
        self.assertEqual(login.email, "user@example.com")

        registration = UserRegister(
            email="USER@Example.COM",
            password="Correct-password!",
            first_name="  Test  ",
            last_name="  User  ",
        )
        self.assertEqual(registration.email, "user@example.com")
        self.assertEqual(registration.first_name, "Test")
        with self.assertRaises(ValidationError):
            UserLogin(email="user@example.com", password="anything", admin=True)

    def test_user_controlled_collections_and_notes_are_bounded(self):
        with self.assertRaises(ValidationError):
            ResumeCreate(name="Resume", skills=[f"skill-{index}" for index in range(101)])
        with self.assertRaises(ValidationError):
            ResumeCreate(name="Resume", skills=["x" * 101])
        with self.assertRaises(ValidationError):
            SkillCreate(name="Python", notes="x" * 10001)
        with self.assertRaises(ValidationError):
            ApplicationCreate(
                job_id="28f548ca-6877-4a84-9686-89fd0af83a13",
                notes="x" * 10001,
            )

    def test_sliding_window_limiter_blocks_and_can_be_reset(self):
        limiter = SlidingWindowLimiter()
        limiter.check("login:test", limit=2, window_seconds=60)
        limiter.check("login:test", limit=2, window_seconds=60)
        with self.assertRaises(HTTPException) as error:
            limiter.check("login:test", limit=2, window_seconds=60)
        self.assertEqual(error.exception.status_code, 429)
        self.assertIn("Retry-After", error.exception.headers)
        limiter.reset("login:test")
        limiter.check("login:test", limit=2, window_seconds=60)
        self.assertEqual(private_identifier(" User@Example.com "), private_identifier("user@example.com"))

    def test_request_body_limit_rejects_oversized_bodies(self):
        async def read_body(scope, receive, send):
            while True:
                message = await receive()
                if not message.get("more_body", False):
                    break
            await send({"type": "http.response.start", "status": 200, "headers": []})
            await send({"type": "http.response.body", "body": b"ok"})

        async def run(body: bytes, include_length: bool):
            headers = [(b"content-length", str(len(body)).encode())] if include_length else []
            scope = {"type": "http", "method": "POST", "path": "/body", "headers": headers}
            messages = [{"type": "http.request", "body": body, "more_body": False}]
            sent = []

            async def receive():
                return messages.pop(0)

            async def send(message):
                sent.append(message)

            app = LimitRequestBodyMiddleware(read_body, max_bytes=8)
            await app(scope, receive, send)
            return sent[0]["status"]

        self.assertEqual(asyncio.run(run(b"123456789", True)), 413)
        self.assertEqual(asyncio.run(run(b"123456789", False)), 413)
        self.assertEqual(asyncio.run(run(b"12345678", True)), 200)

    def test_cookie_authentication_requires_matching_csrf_token_and_origin(self):
        async def endpoint(scope, receive, send):
            await send({"type": "http.response.start", "status": 204, "headers": []})
            await send({"type": "http.response.body", "body": b""})

        async def run(extra_headers):
            scope = {
                "type": "http",
                "method": "POST",
                "path": "/jobs",
                "headers": [
                    (b"cookie", b"careertrack_session=jwt; careertrack_csrf=csrf-value"),
                    *extra_headers,
                ],
            }
            sent = []

            async def receive():
                return {"type": "http.request", "body": b"", "more_body": False}

            async def send(message):
                sent.append(message)

            await CookieCSRFMiddleware(endpoint)(scope, receive, send)
            return sent[0]["status"]

        self.assertEqual(asyncio.run(run([])), 403)
        self.assertEqual(asyncio.run(run([(b"x-csrf-token", b"wrong")])), 403)
        self.assertEqual(
            asyncio.run(run([(b"origin", b"https://attacker.example"), (b"x-csrf-token", b"csrf-value")])),
            403,
        )
        self.assertEqual(asyncio.run(run([(b"x-csrf-token", b"csrf-value")])), 204)

    def test_session_cookies_are_http_only_and_csrf_is_separate_from_jwt(self):
        response = Response()
        csrf_token = set_session_cookie(response, "encoded.jwt.value")
        cookies = [value.decode("latin-1") for name, value in response.raw_headers if name == b"set-cookie"]

        self.assertEqual(len(cookies), 2)
        self.assertTrue(all("HttpOnly" in cookie and "Path=/" in cookie for cookie in cookies))
        self.assertTrue(any("careertrack_session=encoded.jwt.value" in cookie for cookie in cookies))
        self.assertNotEqual(csrf_token, "encoded.jwt.value")

    def test_resume_response_does_not_publish_private_source_data(self):
        from datetime import datetime, timezone
        from app.schemas.resume import ResumeResponse

        response = ResumeResponse(
            extraction_status="ready",
            has_file=True,
            id="resume-id",
            name="Private resume",
            file_name="resume.pdf",
            target_role="Developer",
            skills=["Python"],
            notes="",
            is_default=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        ).model_dump()
        self.assertNotIn("file_path", response)
        self.assertNotIn("parsed_text", response)


if __name__ == "__main__":
    unittest.main()
