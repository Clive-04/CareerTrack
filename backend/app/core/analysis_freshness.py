from hashlib import sha256


JOB_FINGERPRINT = "_source_job_description_fingerprint"
RESUME_FINGERPRINT = "_source_resume_text_fingerprint"


def text_fingerprint(value: str | None) -> str:
    return sha256((value or "").encode("utf-8")).hexdigest()


def source_fingerprints(job_description: str | None, resume_text: str | None) -> dict[str, str]:
    return {
        JOB_FINGERPRINT: text_fingerprint(job_description),
        RESUME_FINGERPRINT: text_fingerprint(resume_text),
    }


def _changed_after_analysis(updated_at, created_at) -> bool:
    if not updated_at or not created_at:
        return False
    try:
        return updated_at > created_at
    except TypeError:
        return updated_at.replace(tzinfo=None) > created_at.replace(tzinfo=None)


def stale_reasons(job, analysis, resume, current_resume_source: str | None = None) -> list[str]:
    if analysis is None:
        return []

    reasons: list[str] = []
    result = analysis.result or {}
    stored_job = result.get(JOB_FINGERPRINT)
    if stored_job:
        if stored_job != text_fingerprint(job.description):
            reasons.append("The job description changed after this analysis.")
    elif _changed_after_analysis(job.updated_at, analysis.created_at):
        reasons.append("The saved job changed after this analysis.")

    if analysis.resume_id is None or resume is None:
        reasons.append("The analyzed resume was deleted.")
    else:
        stored_resume = result.get(RESUME_FINGERPRINT)
        if stored_resume:
            source = current_resume_source if current_resume_source is not None else resume.parsed_text
            if stored_resume != text_fingerprint(source):
                reasons.append("The analyzed resume or its selected skills changed after this analysis.")
        elif _changed_after_analysis(resume.updated_at, analysis.created_at):
            reasons.append("The analyzed resume changed after this analysis.")

    return reasons
