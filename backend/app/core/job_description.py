MIN_JOB_WORDS = 50
MAX_JOB_CHARACTERS = 20000


def validate_job_description(value: str | None) -> str:
    text = (value or "").strip()
    if len(text.split()) < MIN_JOB_WORDS:
        raise ValueError("Job description must contain at least 50 words. Include responsibilities, required skills, experience, and qualifications.")
    if len(text) > MAX_JOB_CHARACTERS:
        raise ValueError("Job description must be 20,000 characters or fewer.")
    return text
