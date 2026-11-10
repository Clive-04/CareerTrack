from hmac import compare_digest

from starlette.responses import JSONResponse

from app.core.config import settings


class RequestBodyTooLarge(Exception):
    pass


class LimitRequestBodyMiddleware:
    """Reject oversized requests before endpoints process their contents."""

    def __init__(self, app, max_bytes: int):
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        content_length = headers.get(b"content-length")
        if content_length:
            try:
                if int(content_length) > self.max_bytes:
                    await self._reject(scope, receive, send)
                    return
            except ValueError:
                pass

        received = 0

        async def limited_receive():
            nonlocal received
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > self.max_bytes:
                    raise RequestBodyTooLarge
            return message

        try:
            await self.app(scope, limited_receive, send)
        except RequestBodyTooLarge:
            await self._reject(scope, receive, send)

    @staticmethod
    async def _reject(scope, receive, send):
        response = JSONResponse(
            {"detail": "Request body is too large."},
            status_code=413,
        )
        await response(scope, receive, send)


class CookieCSRFMiddleware:
    """Require an origin-bound CSRF token when a browser authenticates by cookie."""

    SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}
    AUTH_EXEMPT_PATHS = {"/auth/login", "/auth/register"}

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope.get("method") in self.SAFE_METHODS:
            await self.app(scope, receive, send)
            return

        headers = {key.lower(): value for key, value in scope.get("headers", [])}
        origin = headers.get(b"origin", b"").decode("latin-1").rstrip("/")
        if origin and origin not in settings.frontend_origins:
            await self._reject(scope, receive, send, "Request origin is not allowed.")
            return

        cookies = self._cookies(headers.get(b"cookie", b"").decode("latin-1"))
        authorization = headers.get(b"authorization", b"").lower()
        uses_cookie_auth = settings.AUTH_COOKIE_NAME in cookies and not authorization.startswith(b"bearer ")
        path = scope.get("path", "")
        if uses_cookie_auth and path not in self.AUTH_EXEMPT_PATHS:
            cookie_token = cookies.get(settings.CSRF_COOKIE_NAME, "")
            header_token = headers.get(b"x-csrf-token", b"").decode("latin-1")
            if not cookie_token or not header_token or not compare_digest(cookie_token, header_token):
                await self._reject(scope, receive, send, "CSRF validation failed.")
                return

        await self.app(scope, receive, send)

    @staticmethod
    def _cookies(raw_cookie: str) -> dict[str, str]:
        cookies = {}
        for item in raw_cookie.split(";"):
            name, separator, value = item.strip().partition("=")
            if separator and name:
                cookies[name] = value
        return cookies

    @staticmethod
    async def _reject(scope, receive, send, detail: str):
        response = JSONResponse({"detail": detail}, status_code=403)
        await response(scope, receive, send)
