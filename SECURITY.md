# CareerTrack security and production checklist

## Required production settings

- Set `ENVIRONMENT=production` in the backend.
- Generate a unique `JWT_SECRET_KEY` of at least 32 random characters. Never reuse the database or Gemini secret.
- Use an HTTPS frontend URL in `FRONTEND_ORIGINS`.
- Set `ALLOWED_HOSTS` to the deployed API hostname, without `*`.
- Set `FORCE_HTTPS=true` and configure the reverse proxy to forward the original scheme.
- Set `NEXT_PUBLIC_API_URL` to the public HTTPS API URL before building the frontend.
- Store `DATABASE_URL`, `JWT_SECRET_KEY`, `GEMINI_API_KEY`, and the PostgreSQL password in the deployment platform's secret manager.

The backend intentionally refuses to start in production when HTTPS origins, host restrictions, or HTTPS enforcement are missing.

## Deployment controls

- Terminate TLS at a trusted reverse proxy or managed platform and redirect HTTP to HTTPS.
- Apply rate limiting to `/auth/login`, `/auth/register`, and AI analysis endpoints at the gateway or load balancer.
- Do not expose PostgreSQL to the public internet. The development Compose file binds it to localhost only.
- Run the API and frontend as non-root users with read-only application filesystems where supported.
- Back up PostgreSQL and private resume uploads, encrypt backups, and test restoration regularly.
- Send application logs to centralized monitoring, alert on repeated authentication failures, and never log tokens, passwords, resume text, or API keys.
- Run `npm audit --omit=dev` and `python -m pip_audit -r backend/requirements.txt` in CI.

## Remaining architectural improvement

The browser currently stores its bearer token in `localStorage`. The Content Security Policy reduces script-injection risk, but a future authentication revision should move the token to a `Secure`, `HttpOnly`, `SameSite` cookie and add CSRF protection for state-changing requests.
