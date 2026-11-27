"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, ShieldCheck, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useResumes } from "@/components/ResumesProvider";
import AnalysisDeleteModal from "@/components/AnalysisDeleteModal";
import OutdatedAnalysisWarning from "@/components/OutdatedAnalysisWarning";
import type { Job } from "@/components/JobsProvider";
import { analyzeResume, previewAnalysis, getAnalysisHistory, deleteAnalysisHistory, type AnalysisPreview, type ResumeAnalysis } from "@/lib/api";
import { countWords, MIN_JOB_WORDS } from "@/lib/jobDescription";

type ReviewSection = "resume" | "skills" | "job";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ResumeAnalysisDialog({ job, onClose, onAnalysisChange, initialView = "new" }: { job: Job; onClose: () => void; onAnalysisChange?: () => void | Promise<void>; initialView?: "new" | "history" }) {
  const router = useRouter();
  const { token } = useAuth();
  const { resumes } = useResumes();
  const ready = resumes.filter((resume) => resume.hasFile && resume.extractionStatus === "ready");
  const [resumeId, setResumeId] = useState(ready.find((resume) => resume.isDefault)?.id ?? ready[0]?.id ?? "");
  const [preview, setPreview] = useState<AnalysisPreview | null>(null);
  const [reviewSection, setReviewSection] = useState<ReviewSection>("resume");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<"preview" | "analysis" | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const [view, setView] = useState(initialView);
  const [history, setHistory] = useState<ResumeAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ResumeAnalysis | null>(null);
  const [deleting, setDeleting] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getAnalysisHistory(token, job.id)
      .then((items) => { if (active) setHistory(items); })
      .catch((error) => { if (active) setHistoryError(error instanceof Error ? error.message : "Your saved comparisons could not be loaded."); })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [token, job.id]);

  async function confirmDelete() {
    if (!token || !deleteTarget || pending.current) return;
    pending.current = true;
    setDeleting(true);
    setError("");
    try {
      await deleteAnalysisHistory(token, job.id, deleteTarget.id);
      setHistory((items) => items.filter((item) => item.id !== deleteTarget.id));
      if (result?.id === deleteTarget.id) setResult(null);
      setDeleteTarget(null);
      await onAnalysisChange?.();
    } catch (error) { setError(error instanceof Error ? error.message : "The comparison could not be deleted. Try again."); }
    finally { pending.current = false; setDeleting(false); }
  }

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  async function loadPreview() {
    if (!token || !resumeId || pending.current) return;
    pending.current = true;
    setBusy("preview");
    setError("");
    try {
      const prepared = await previewAnalysis(token, job.id, resumeId);
      setPreview({ ...prepared, skills_context: prepared.skills_context ?? "" });
      setReviewSection("resume");
    }
    catch (error) { setError(error instanceof Error ? error.message : "The text could not be prepared. Try again."); }
    finally { pending.current = false; setBusy(null); }
  }

  async function runAnalysis() {
    if (!token || !preview || !consent || pending.current) return;
    pending.current = true;
    setBusy("analysis");
    dialog.current?.scrollTo({ top: 0 });
    setError("");
    setResult(null);
    try {
      const saved = await analyzeResume(token, job.id, resumeId, preview, consent);
      setResult(saved);
      setHistory((items) => [saved, ...items]);
      await onAnalysisChange?.();
    }
    catch (error) { setError(error instanceof Error ? error.message : "The comparison did not finish. Your reviewed text is kept; try again in a minute."); }
    finally { pending.current = false; setBusy(null); setConsent(false); }
  }

  function openPrefilledApplication(selectedResumeId: string) {
    onClose();
    router.push(`/applications?job=${encodeURIComponent(job.id)}&resume=${encodeURIComponent(selectedResumeId)}`);
  }

  const lengthsValid = preview && preview.resume_text.trim().length >= 50 && preview.resume_text.length <= 40000
    && preview.skills_context.length <= 10000
    && countWords(preview.job_description) >= MIN_JOB_WORDS && preview.job_description.length <= 20000;
  const jobTooShort = countWords(job.description) < MIN_JOB_WORDS;

  return (
    <dialog
      ref={dialog}
      onCancel={(event) => { event.preventDefault(); if (!busy && !deleting) { if (deleteTarget) setDeleteTarget(null); else onClose(); } }}
      aria-labelledby="analysis-title"
      className="app-native-dialog m-auto max-h-[90vh] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto rounded-[var(--radius-card)] border border-slate-200 bg-white p-0 text-slate-900 shadow-[var(--shadow-raised)] backdrop:bg-[rgb(17_14_42/52%)]"
    >
      <div className="app-modal-header">
        <div>
          <h2 id="analysis-title" className="text-xl font-semibold text-slate-900">Resume match</h2>
          <p className="mt-0.5 text-sm text-slate-600">{job.position} at {job.company}</p>
        </div>
        <button type="button" disabled={!!busy || deleting} aria-label="Close analysis" title="Close" onClick={onClose} className="app-icon-button app-icon-button-ghost">
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-5 p-6">
        <div role="tablist" aria-label="Resume match views" className="flex gap-6 border-b border-slate-200">
          {(["new", "history"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              disabled={!!busy || deleting}
              aria-selected={view === tab}
              onClick={() => { setView(tab); setResult(null); setConsent(false); setDeleteTarget(null); setError(""); }}
              className={`-mb-px border-b-2 px-0.5 pb-2.5 text-[0.9375rem] font-medium transition-colors ${view === tab ? "border-indigo-700 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              {tab === "new" ? "New comparison" : `History${history.length ? ` (${history.length})` : ""}`}
            </button>
          ))}
        </div>

        {view === "history" && !result && (
          <section aria-label="Saved comparisons">
            {historyLoading && (
              <div role="status" aria-label="Loading saved comparisons" className="space-y-3">
                <span className="app-skeleton block h-12" aria-hidden="true" />
                <span className="app-skeleton block h-12" aria-hidden="true" />
              </div>
            )}
            {historyError && <p role="alert" className="app-notice-error">{historyError}</p>}
            {!historyLoading && !historyError && !history.length && (
              <div className="py-8 text-center">
                <p className="font-medium text-slate-800">No saved comparisons yet</p>
                <p className="mt-1 text-sm text-slate-600">Run a new comparison to see how your resume lines up with this job.</p>
                <button type="button" onClick={() => setView("new")} className="app-button-secondary app-button-compact mt-4">Start a comparison</button>
              </div>
            )}
            {history.length > 0 && (
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {history.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                    <span className="w-16 text-lg font-semibold tabular-nums text-slate-900">{item.score}<span className="text-sm font-normal text-slate-500">/100</span></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{item.resume_name}</p>
                      <p className="text-sm text-slate-500">{formatDateTime(item.created_at)}</p>
                    </div>
                    <button type="button" disabled={deleting} onClick={() => { setResult(item); setDeleteTarget(null); }} className="app-button-secondary app-button-compact">View result</button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => { setDeleteTarget(item); setError(""); }}
                      aria-label={`Delete the comparison for ${item.resume_name} from ${formatDateTime(item.created_at)}`}
                      title="Delete comparison"
                      className="app-icon-button app-icon-button-ghost app-icon-button-compact hover:!text-red-700"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {deleteTarget && <AnalysisDeleteModal resumeName={deleteTarget.resume_name} deleting={deleting} error={error} onCancel={() => { setDeleteTarget(null); setError(""); }} onConfirm={confirmDelete} />}

        {busy === "analysis" && (
          <div role="status" aria-live="polite" className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
            <span className="app-spinner !h-8 !w-8 !border-[3px]" aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-slate-900">Comparing your resume with the job</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">This can take up to two minutes. You can keep this window open; the result is saved to this job’s history when it’s ready.</p>
          </div>
        )}

        {view === "new" && !result && busy !== "analysis" && (
          <div className="space-y-5">
            {jobTooShort && (
              <p className="app-notice-warning">This job’s description has fewer than {MIN_JOB_WORDS} words. Edit the job and paste the full posting before comparing.</p>
            )}

            <ol className="space-y-5">
              <li>
                <h3 className="text-[0.9375rem] font-semibold text-slate-900">1. Choose a resume</h3>
                <label className="sr-only" htmlFor="analysis-resume">Resume</label>
                <select
                  id="analysis-resume"
                  className="form-input mt-2 sm:max-w-md"
                  disabled={!!busy}
                  value={resumeId}
                  onChange={(event) => { setResumeId(event.target.value); setPreview(null); setReviewSection("resume"); setConsent(false); setError(""); }}
                >
                  <option value="">Choose a resume</option>
                  {ready.map((resume) => <option key={resume.id} value={resume.id}>{resume.name}</option>)}
                </select>
                {!ready.length && (
                  <p className="app-field-hint">
                    No resume is ready yet. <Link href="/resumes" className="app-button-text !inline">Upload or extract one on Resumes</Link>.
                  </p>
                )}
                {!preview && (
                  <button type="button" onClick={loadPreview} disabled={!resumeId || !!busy || jobTooShort} aria-busy={busy === "preview"} className="app-button-secondary mt-3">
                    {busy === "preview" && <span className="app-spinner" aria-hidden="true" />}
                    {busy === "preview" ? "Preparing text…" : "Review text before sending"}
                  </button>
                )}
              </li>

              {preview && (
                <>
                  <li>
                    <h3 className="text-[0.9375rem] font-semibold text-slate-900">2. Review what will be sent</h3>
                    <div className="app-notice-warning mt-2">
                      <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p>Remove personal or confidential details from each section. Nothing is sent while you review, and edits here don’t change your stored files.</p>
                        <details className="mt-1.5 text-sm">
                          <summary className="cursor-pointer font-medium">Why this matters</summary>
                          <p className="mt-1.5">Text sent to Google Gemini’s free tier may be reviewed by people or used to improve Google products. Automatic contact removal is helpful but incomplete. <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer" className="font-medium underline">Read Google’s data terms</a>.</p>
                        </details>
                      </div>
                    </div>

                    <div className="mt-3 rounded-[var(--radius-card)] border border-slate-200">
                      <div role="tablist" aria-label="Text to review before sending" className="flex gap-6 border-b border-slate-200 px-4">
                        {([["resume", "Resume"], ["skills", "Skills"], ["job", "Job"]] as const).map(([section, label]) => (
                          <button
                            key={section}
                            type="button"
                            role="tab"
                            aria-selected={reviewSection === section}
                            aria-controls={`analysis-${section}-panel`}
                            onClick={() => setReviewSection(section)}
                            className={`-mb-px border-b-2 py-2.5 text-sm font-medium transition-colors ${reviewSection === section ? "border-indigo-700 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <div id={`analysis-${reviewSection}-panel`} role="tabpanel" className="p-4">
                        {reviewSection === "resume" && (
                          <ReviewText
                            id="analysis-resume-text"
                            label="Resume text"
                            counter={`${preview.resume_text.length.toLocaleString()} / 40,000 characters`}
                            value={preview.resume_text}
                            disabled={!!busy}
                            onChange={(value) => { setPreview({ ...preview, resume_text: value }); setConsent(false); }}
                          />
                        )}
                        {reviewSection === "skills" && (
                          <ReviewText
                            id="analysis-skills-text"
                            label="Selected skills context"
                            counter={`${preview.skills_context.length.toLocaleString()} / 10,000 characters`}
                            value={preview.skills_context}
                            placeholder="No skills are selected on this resume."
                            disabled={!!busy}
                            onChange={(value) => { setPreview({ ...preview, skills_context: value }); setConsent(false); }}
                          />
                        )}
                        {reviewSection === "job" && (
                          <ReviewText
                            id="analysis-job-text"
                            label="Job requirements"
                            counter={`${countWords(preview.job_description)} words · ${preview.job_description.length.toLocaleString()} / 20,000 characters`}
                            value={preview.job_description}
                            disabled={!!busy}
                            onChange={(value) => { setPreview({ ...preview, job_description: value }); setConsent(false); }}
                          />
                        )}
                      </div>
                    </div>
                    {!lengthsValid && (
                      <p className="app-field-error">The resume needs at least 50 characters and the job at least {MIN_JOB_WORDS} words. Shorten any section that is over its limit.</p>
                    )}
                  </li>

                  <li>
                    <h3 className="text-[0.9375rem] font-semibold text-slate-900">3. Send for comparison</h3>
                    <label className="mt-2 flex items-start gap-3 text-sm leading-6 text-slate-700">
                      <input type="checkbox" checked={consent} disabled={!!busy} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand)]" />
                      <span>I reviewed all three sections, removed personal and confidential information, and consent to sending this text to Google Gemini. Results are saved privately and can be deleted later.</span>
                    </label>
                    <button type="button" disabled={!consent || !lengthsValid || !!busy} onClick={runAnalysis} className="app-button-primary mt-3 w-full sm:w-auto">
                      Send for comparison
                    </button>
                    {(!consent || !lengthsValid) && (
                      <p className="app-field-hint">{!lengthsValid ? "Fix the text length above to continue." : "Confirm the review checkbox to continue."}</p>
                    )}
                  </li>
                </>
              )}
            </ol>
          </div>
        )}

        {error && !deleteTarget && <p role="alert" className="app-notice-error">{error}</p>}

        {result && (
          <div className="space-y-6" aria-live="polite">
            <section aria-labelledby="result-score" className="border-b border-slate-200 pb-5">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <p id="result-score" className="text-[2rem] font-semibold leading-none tabular-nums text-slate-900">
                  {result.score}<span className="text-lg font-normal text-slate-500">/100</span>
                </p>
                <p className="text-sm text-slate-600">{result.resume_name} · {formatDateTime(result.created_at)}</p>
              </div>
              <p className="mt-3 max-w-[68ch] leading-7 text-slate-800">{result.summary}</p>
              <details className="mt-2 text-sm text-slate-600">
                <summary className="cursor-pointer font-medium text-slate-700">How to read this score</summary>
                <p className="mt-1.5 max-w-[68ch]">It estimates how well the text you sent lines up with the job’s requirements. It isn’t a hiring prediction or an applicant-tracking score, and it reflects the job and resume as they were at {formatDateTime(result.created_at)}.</p>
              </details>
            </section>

            <section aria-labelledby="result-evidence">
              <h3 id="result-evidence" className="font-semibold text-slate-900">Evidence found <span className="font-normal text-slate-500">({result.matches.length})</span></h3>
              {!result.matches.length ? (
                <p className="mt-2 text-sm text-slate-600">No requirement was clearly supported by the resume text.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-200 border-y border-slate-200">
                  {result.matches.map((match, index) => (
                    <li key={index} className="flex gap-3 py-3">
                      <Check size={16} className="mt-1 shrink-0 text-emerald-700" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-slate-900">{match.requirement}</p>
                        <p className="mt-0.5 text-sm text-slate-600">From your resume: “{match.evidence}”</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {result.gaps.length > 0 && (
              <section aria-labelledby="result-gaps">
                <h3 id="result-gaps" className="font-semibold text-slate-900">Not shown in your resume <span className="font-normal text-slate-500">({result.gaps.length})</span></h3>
                <p className="mt-0.5 text-sm text-slate-500">These may be missing from the text rather than from your experience.</p>
                <ul className="mt-2 space-y-2">
                  {result.gaps.map((gap, index) => (
                    <li key={index} className="flex gap-3 text-[0.9375rem] text-slate-800">
                      <Minus size={16} className="mt-1 shrink-0 text-amber-700" aria-hidden="true" />{gap}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {result.suggestions.length > 0 && (
              <section aria-labelledby="result-suggestions">
                <h3 id="result-suggestions" className="font-semibold text-slate-900">Recommended changes</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-[0.9375rem] text-slate-800 marker:text-slate-500">
                  {result.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
                </ol>
                <p className="mt-2 text-sm text-slate-500">Only add what you can support in an interview.</p>
              </section>
            )}

            {job.latestAnalysisIsStale && (
              <OutdatedAnalysisWarning reasons={job.latestAnalysisStaleReasons} message="Run a new comparison before you apply for the most accurate result." />
            )}

            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-5">
              {result.resume_id && (
                <button type="button" onClick={() => openPrefilledApplication(result.resume_id!)} className="app-button-primary">
                  Track application with this resume
                </button>
              )}
              <Link href="/resumes" onClick={onClose} className="app-button-secondary">Edit resume details</Link>
              <button type="button" onClick={() => { setResult(null); setConsent(false); }} className="app-button-ghost">
                {view === "history" ? "Back to history" : "Review text again"}
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}

function ReviewText({
  id,
  label,
  counter,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  counter: string;
  value: string;
  placeholder?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-semibold text-slate-800" htmlFor={id}>{label}</label>
        <span className="text-[0.8125rem] tabular-nums text-slate-500">{counter}</span>
      </div>
      <textarea id={id} rows={10} disabled={disabled} className="form-input leading-6" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </>
  );
}
