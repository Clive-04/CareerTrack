# Gemini resume analysis

Add these settings to your existing `backend/.env` (keep your database and JWT settings):

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.8-flash
```

Get your key from https://aistudio.google.com/apikey. Do not commit the key or put it in a `NEXT_PUBLIC_` variable. Run `alembic upgrade head` for the analysis history table, then restart Uvicorn after changing settings. No extra Python package is needed for this integration.

## Use

1. Upload a PDF/DOCX and extract its text in Resumes.
2. Save a job with a meaningful description and requirements.
3. In Saved Jobs, choose Analyze Resume, select a resume, then Review text before sending.
4. Remove personal, confidential, and sensitive details from both text fields. Common contacts are removed automatically, but this is not complete anonymization. Prefer fictitious sample data for testing the unpaid tier.
5. Check consent and click Analyze with Gemini. The checkbox resets after every attempt and when you change the text or resume.

Only the reviewed text and analysis instructions go to Google. Original files, account credentials, and resume IDs are not sent. Preview uses only the local backend. CareerTrack saves successful results (including quoted evidence), resume/job labels, model, and date in private account history. Reviewed input text is not separately stored; the original extracted text stays in its existing private resume record. Google handles submitted data under its own terms.

Use Analysis History on a saved job to reopen or permanently delete a result. Results are snapshots and do not change after editing the job or resume. Deleting a resume retains its historical results and label; deleting the saved job removes its history. Results created before this feature cannot be recovered.

Google's unpaid-service terms say inputs/outputs can be used to improve products and reviewed by people, and prohibit submitting personal, sensitive, or confidential information. Review the current terms before using real resumes:
- https://ai.google.dev/gemini-api/terms
- https://ai.google.dev/gemini-api/docs/pricing

The default model has a listed free tier, but project availability and quotas vary. This app cannot determine billing status or guarantee zero charges on a billing-enabled project. Use Google AI Studio to check your quota and billing settings. There are no automatic retries or model fallbacks.

## Limits and verification

Resume text needs at least 50 characters and is limited to 40,000 characters. Saved and reviewed job descriptions need at least 50 whitespace-separated words and are limited to 20,000 characters. Existing shorter descriptions remain visible but must be completed before saving edits or analyzing. Word count alone does not guarantee useful content: include responsibilities, skills, experience, and qualifications. The backend waits up to 60 seconds and applies one attempt per user per minute per server process. This local throttle is not a distributed production rate limiter.

Scores estimate document alignment, not hiring likelihood. Model outputs are schema-validated; matching evidence must be present in the supplied resume text. Other reasoning and suggestions can still be wrong. Review them before acting.

Tests use mocked Gemini responses and an isolated database; they do not contact Google or consume quota:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

A live smoke test with fictitious resume text is still needed after configuring your key. Expected failures: missing key (503), quota (429), timeout (504), and malformed/unsupported model output (502).
