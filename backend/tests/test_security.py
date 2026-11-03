import unittest

import jwt
from pydantic import ValidationError

from app.core.config import Settings
from app.core.security import create_access_token, decode_access_token
from app.schemas.auth import UserRegister


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


if __name__ == "__main__":
    unittest.main()
