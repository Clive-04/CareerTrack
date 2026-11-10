    # CareerTrack free deployment guide

This deployment uses only free plans:

- **Supabase Free** for PostgreSQL and private resume files
- **Render Free** for the FastAPI backend
- **Vercel Hobby** for the Next.js frontend

The frontend sends browser requests through its own `/api` path. Vercel then proxies them to Render. This keeps authentication cookies first-party instead of relying on cross-site cookies.

## 1. Prepare Supabase

1. Create a free Supabase project in the closest available region.
2. In **Connect**, copy the **Session pooler** PostgreSQL connection string. Change its scheme from `postgresql://` to `postgresql+psycopg://` before using it as `DATABASE_URL`.
3. In **Storage**, create a bucket named `careertrack-resumes` and leave it **private**.
4. Open the project's S3 settings and create S3 access keys.
5. Record the S3 endpoint, region, access key ID, and secret access key. Never put these values in a frontend variable or commit them to Git.

If the database password contains reserved URL characters, use the connection string supplied by Supabase or URL-encode the password.

## 2. Deploy the backend on Render

1. Push this Phase 16 branch to GitHub when it is ready.
2. In Render, choose **New > Blueprint** and select this repository. Render will read `render.yaml`.
3. Keep the service on the **Free** plan.
4. Supply the secret values requested by the Blueprint:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase Session pooler URL with the `postgresql+psycopg://` scheme |
| `FRONTEND_ORIGINS` | Final Vercel URL, for example `https://careertrack.vercel.app` |
| `ALLOWED_HOSTS` | Render hostname only, for example `careertrack-api.onrender.com` |
| `GEMINI_API_KEY` | Gemini API key |
| `S3_ENDPOINT_URL` | Supabase S3 endpoint; it must begin with `https://` |
| `S3_REGION` | Region shown in Supabase S3 settings |
| `S3_ACCESS_KEY_ID` | Supabase S3 access key ID |
| `S3_SECRET_ACCESS_KEY` | Supabase S3 secret access key |
| `S3_BUCKET` | `careertrack-resumes` |

The generated `JWT_SECRET_KEY` is intentionally managed by Render. Do not replace it with the development key.

The start command applies Alembic migrations before starting FastAPI. A successful deployment should return JSON from:

- `https://YOUR-RENDER-HOST/health`
- `https://YOUR-RENDER-HOST/health/database`

If the final Vercel address is not known yet, use an HTTPS placeholder for `FRONTEND_ORIGINS`, deploy Vercel, then immediately replace the placeholder with the exact Vercel origin.

## 3. Deploy the frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Keep the detected framework as **Next.js** and the plan as **Hobby**.
4. Add these production environment variables:

```text
NEXT_PUBLIC_API_URL=/api
BACKEND_API_URL=https://YOUR-RENDER-HOST.onrender.com
```

`BACKEND_API_URL` is server-only. Do not prefix it with `NEXT_PUBLIC_`.

5. Deploy the project.
6. Copy the final Vercel origin into Render's `FRONTEND_ORIGINS`, without a trailing slash, and redeploy the backend if needed.

## 4. Production smoke test

Use a new test account and verify:

1. Landing, register, login, refresh, and logout work.
2. A saved job, application, interview, and skill can be created, edited, and deleted.
3. A PDF or DOCX resume uploads, downloads, extracts, and remains available after a Render restart.
4. Gemini analysis completes and its history remains private to the signed-in account.
5. A second account cannot see the first account's data.
6. Browser developer tools show API calls going to `/api/...` on the Vercel hostname, not directly to Render.
7. No API keys, database passwords, S3 keys, JWTs, or resume text appear in browser storage, source files, or logs.

## Free-plan limitations

- Render Free sleeps after inactivity, so the first request can take roughly a minute.
- Supabase may pause an inactive free project; restore it from the Supabase dashboard when that happens.
- Free plans have monthly usage and storage limits. This setup is appropriate for a personal project, not guaranteed production availability.
- Render's local filesystem is temporary. Production resume files must remain configured for Supabase S3 storage.

## Local development remains unchanged

Local development continues to use:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
RESUME_STORAGE_BACKEND=local
```

No Supabase storage keys are required when developing locally.
