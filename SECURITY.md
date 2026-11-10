# CareerTrack security and production checklist

## Required production settings

- Set `ENVIRONMENT=production` in the backend.
- Generate a unique `JWT_SECRET_KEY` of at least 32 random characters. Never reuse the database or Gemini secret.
- Use an HTTPS frontend URL in `FRONTEND_ORIGINS`.
- Set `ALLOWED_HOSTS` to the deployed API hostname, without `*`.
- Set `FORCE_HTTPS=true` and configure the reverse proxy to forward the original scheme.
- Set `NEXT_PUBLIC_API_URL` to the public HTTPS API URL before building the frontend.
- Store `DATABASE_URL`, `JWT_SECRET_KEY`, `GEMINI_API_KEY`, and the PostgreSQL password in the deployment platform's secret manager.
- Leave `DB_ECHO=false` so SQL statements and bound values are not written to production logs.
- Set `MAX_REQUEST_BYTES` to the largest request the API should accept; the default is 11 MiB to support a 10 MiB résumé plus multipart overhead.
- Set `AUTH_COOKIE_SECURE=true` in production. Keep `AUTH_COOKIE_SAMESITE=lax` when frontend and API are on the same site; use `none` only for an HTTPS cross-site deployment.
- Set `AUTH_COOKIE_DOMAIN` only when the session must be shared with a specific parent domain. Do not use an unnecessarily broad cookie domain.

The backend intentionally refuses to start in production when HTTPS origins, host restrictions, or HTTPS enforcement are missing.

## Deployment controls

- Terminate TLS at a trusted reverse proxy or managed platform and redirect HTTP to HTTPS.
- Keep gateway or load-balancer rate limits on `/auth/login`, `/auth/register`, and AI analysis endpoints. The API has per-process defense-in-depth limits, but a gateway is required for consistent limits across multiple workers or instances.
- Do not expose PostgreSQL to the public internet. The development Compose file binds it to localhost only.
- Run the API and frontend as non-root users with read-only application filesystems where supported.
- Back up PostgreSQL and private resume uploads, encrypt backups, and test restoration regularly.
- Send application logs to centralized monitoring, alert on repeated authentication failures, and never log tokens, passwords, resume text, or API keys.
- Run `npm audit --omit=dev` and `python -m pip_audit -r backend/requirements.txt` in CI.

## Application protections

- Authentication input is normalized, unexpected request fields are rejected, and duplicate registration races return a controlled conflict response.
- User-controlled notes, skill lists, query filters, salaries, and request bodies have explicit size or value limits.
- Resource identifiers are validated as UUIDs before database access, and ownership checks cover jobs, applications, interviews, resumes, skills, dashboards, and AI history.
- Internal résumé storage keys and extracted résumé text are never included in ordinary résumé API responses. Downloads and AI analysis still require the owning account.
- Production responses include HSTS and standard anti-sniffing, anti-framing, referrer, permissions, and no-store headers where sensitive data is involved.
- Browser JWTs are stored in Secure HttpOnly cookies instead of `localStorage`. State-changing cookie-authenticated requests require an origin check and a matching in-memory CSRF token.

## Remaining architectural improvement

The production Content Security Policy still permits inline scripts and styles for Next.js compatibility. A future deployment hardening pass should adopt per-request CSP nonces after confirming support across every rendered route. Global gateway rate limits remain required when running multiple API workers or instances.
