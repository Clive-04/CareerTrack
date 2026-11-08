"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, BriefcaseBusiness, FileText, LoaderCircle, ShieldCheck, Sparkles, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useResumes } from "@/components/ResumesProvider";
import AnalysisDeleteModal from "@/components/AnalysisDeleteModal";
import OutdatedAnalysisWarning from "@/components/OutdatedAnalysisWarning";
import type { Job } from "@/components/JobsProvider";
import { analyzeResume, previewAnalysis, getAnalysisHistory, deleteAnalysisHistory, type AnalysisPreview, type ResumeAnalysis } from "@/lib/api";
import { countWords, MIN_JOB_WORDS } from "@/lib/jobDescription";

type ReviewSection = "resume" | "skills" | "job";

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
      .catch((error) => { if (active) setHistoryError(error instanceof Error ? error.message : "Unable to load history."); })
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
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to delete analysis."); }
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
    catch (error) { setError(error instanceof Error ? error.message : "Unable to prepare the text."); }
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
    catch (error) { setError(error instanceof Error ? error.message : "Analysis failed. Please try again later."); }
    finally { pending.current = false; setBusy(null); setConsent(false); }
  }

  function openPrefilledApplication(resumeId: string) {
    onClose();
    router.push(`/applications?job=${encodeURIComponent(job.id)}&resume=${encodeURIComponent(resumeId)}`);
  }

  const lengthsValid = preview && preview.resume_text.trim().length >= 50 && preview.resume_text.length <= 40000
    && preview.skills_context.length <= 10000
    && countWords(preview.job_description) >= MIN_JOB_WORDS && preview.job_description.length <= 20000;
  const inputClass = "app-input disabled:opacity-60";

  return (
    <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); if (!busy && !deleting) { if (deleteTarget) setDeleteTarget(null); else onClose(); } }}
      aria-labelledby="analysis-title" className="app-native-dialog m-auto max-h-[90vh] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"><Sparkles size={14} aria-hidden="true" />Powered by Gemini AI</span>
          <h2 id="analysis-title" className="w-fit rounded-lg bg-violet-50 px-3 py-2 text-xl font-bold text-violet-950">AI Resume Analysis</h2>
          <p className="mt-1 text-sm text-slate-600">{job.position} at {job.company}</p>
          <p className="mt-2 text-sm text-slate-500">Compare your resume with this job using AI to find matching qualifications, gaps, and improvements.</p>
        </div>
        <button type="button" disabled={!!busy || deleting} aria-label="Close analysis" onClick={onClose} className="app-icon-button app-icon-button-ghost shrink-0 disabled:opacity-40"><X size={20} /></button>
      </div>

      <div className="mt-5 space-y-4">
        <div role="tablist" aria-label="Analysis views" className="flex gap-2 border-b pb-3">
          {(["new", "history"] as const).map((tab) => <button key={tab} type="button" role="tab" disabled={!!busy || deleting} aria-selected={view === tab}
            onClick={() => { setView(tab); setResult(null); setConsent(false); setDeleteTarget(null); setError(""); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === tab ? "bg-violet-100 text-violet-800" : "text-slate-600 hover:bg-slate-100"}`}>
            {tab === "new" ? "New analysis" : "Saved history"}
          </button>)}
        </div>
        {view === "history" && !result && <section className="space-y-3">
          {historyLoading && <div role="status" className="app-loading-state"><span className="app-spinner" aria-hidden="true" />Loading analysis history...</div>}
          {historyError && <p role="alert" className="app-notice-error">{historyError}</p>}
          {!historyLoading && !historyError && !history.length && <div className="app-empty-state !py-10"><Sparkles size={30} className="mx-auto text-violet-300" /><p className="mt-3 font-semibold text-slate-700">No saved analyses yet</p><p className="mt-1 text-sm text-slate-500">Completed analyses will appear here.</p></div>}
          {history.map((item) => <article key={item.id} className="app-data-card">
            <p className="font-semibold">{item.resume_name} · {item.score}/100</p>
            <p className="mt-1 text-sm text-slate-500">{item.job_title} at {item.company} · {new Date(item.created_at).toLocaleString()}</p>
            <div className="app-card-actions">
              <button type="button" disabled={deleting} onClick={() => { setResult(item); setDeleteTarget(null); }} className="app-button-secondary !text-blue-700">View result</button>
              <button type="button" disabled={deleting} onClick={() => { setDeleteTarget(item); setError(""); }} className="app-button-danger-outline">Delete</button>
            </div>
          </article>)}
        </section>}
        {deleteTarget && <AnalysisDeleteModal resumeName={deleteTarget.resume_name} deleting={deleting} error={error} onCancel={() => { setDeleteTarget(null); setError(""); }} onConfirm={confirmDelete} />}
        {busy === "analysis" && (
          <div role="status" aria-live="polite" className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-violet-100 bg-violet-50/60 px-6 py-10 text-center">
            <LoaderCircle size={40} aria-hidden="true" className="motion-safe:animate-spin text-violet-600" />
            <h3 className="mt-5 text-lg font-semibold text-slate-900">Gemini AI is analyzing your resume</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Comparing the reviewed resume and selected skill details with the job requirements to identify relevant experience and suggested improvements.</p>
            <p className="mt-4 text-xs text-slate-500">This may take up to two minutes on Gemini&apos;s free tier. Your results will appear here when ready.</p>
          </div>
        )}

        {view === "new" && !result && busy !== "analysis" && <>
          {countWords(job.description) < MIN_JOB_WORDS && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Edit this saved job first: its description needs at least 50 words with specific responsibilities and requirements.</p>}
          <label className="block text-sm font-medium" htmlFor="analysis-resume">Resume</label>
          <select id="analysis-resume" className={inputClass} disabled={!!busy} value={resumeId}
            onChange={(event) => { setResumeId(event.target.value); setPreview(null); setReviewSection("resume"); setConsent(false); setError(""); }}>
            <option value="">Choose a resume with extracted text</option>
            {ready.map((resume) => <option key={resume.id} value={resume.id}>{resume.name}</option>)}
          </select>
          {!ready.length && <p className="text-sm text-amber-700">Upload a readable resume and extract its text on the <Link href="/resumes" className="underline">Resumes page</Link> first.</p>}

          {!preview && <button type="button" onClick={loadPreview} disabled={!resumeId || !!busy || countWords(job.description) < MIN_JOB_WORDS}
            className="app-button-primary disabled:opacity-50">{busy ? "Preparing text..." : "Review text before sending"}</button>}

          {preview && <>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Review before sending</p>
                  <p className="mt-1 leading-6 text-amber-800">Remove personal, sensitive, or confidential information from each section. Nothing is sent while you review.</p>
                  <details className="mt-2 text-xs leading-5 text-amber-700">
                    <summary className="cursor-pointer font-semibold">Why this matters</summary>
                    <p className="mt-2">Gemini free-tier content may be reviewed by people or used to improve Google products. Automatic contact removal is helpful but incomplete. Use anonymized or sample information when possible. <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer" className="font-semibold underline">Read Google’s data terms</a>.</p>
                  </details>
                </div>
              </div>
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div role="tablist" aria-label="Text to review before analysis" className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/80 p-1.5">
                {([
                  ["resume", "Resume", FileText],
                  ["skills", "Skills", Brain],
                  ["job", "Job", BriefcaseBusiness],
                ] as const).map(([section, label, Icon]) => (
                  <button
                    key={section}
                    type="button"
                    role="tab"
                    aria-selected={reviewSection === section}
                    aria-controls={`analysis-${section}-panel`}
                    onClick={() => setReviewSection(section)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${reviewSection === section ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:bg-white/70 hover:text-slate-800"}`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>

              <div id={`analysis-${reviewSection}-panel`} role="tabpanel" className="p-4 sm:p-5">
                {reviewSection === "resume" && <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <label className="font-semibold text-slate-800" htmlFor="analysis-resume-text">Resume text</label>
                    <span className="text-xs text-slate-400">{preview.resume_text.length.toLocaleString()} / 40,000 characters</span>
                  </div>
                  <textarea id="analysis-resume-text" rows={11} disabled={!!busy} className={`${inputClass} leading-6`} value={preview.resume_text}
                    onChange={(event) => { setPreview({ ...preview, resume_text: event.target.value }); setConsent(false); }} />
                  <p className="mt-2 text-xs leading-5 text-slate-500">Extracted from the selected resume. Editing this copy does not change the stored file.</p>
                </>}

                {reviewSection === "skills" && <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <label className="font-semibold text-slate-800" htmlFor="analysis-skills-text">Selected skills context</label>
                    <span className="text-xs text-slate-400">{preview.skills_context.length.toLocaleString()} / 10,000 characters</span>
                  </div>
                  <textarea id="analysis-skills-text" rows={11} disabled={!!busy} className={`${inputClass} leading-6`} value={preview.skills_context}
                    placeholder="No skills are currently selected on this resume."
                    onChange={(event) => { setPreview({ ...preview, skills_context: event.target.value }); setConsent(false); }} />
                  <p className="mt-2 text-xs leading-5 text-slate-500">Includes each selected skill&apos;s category, proficiency, experience, and notes when available.</p>
                </>}

                {reviewSection === "job" && <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <label className="font-semibold text-slate-800" htmlFor="analysis-job-text">Job requirements</label>
                    <span className="text-xs text-slate-400">{countWords(preview.job_description)} words · {preview.job_description.length.toLocaleString()} / 20,000 characters</span>
                  </div>
                  <textarea id="analysis-job-text" rows={11} disabled={!!busy} className={`${inputClass} leading-6`} value={preview.job_description}
                    onChange={(event) => { setPreview({ ...preview, job_description: event.target.value }); setConsent(false); }} />
                  <p className="mt-2 text-xs leading-5 text-slate-500">The saved job description used to assess alignment, gaps, and possible improvements.</p>
                </>}
              </div>
            </section>

            {!lengthsValid && <p className="app-notice-warning">The resume needs at least 50 characters and the job needs at least 50 words. Shorten any section exceeding its displayed limit.</p>}

            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
              <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                <input type="checkbox" checked={consent} disabled={!!busy} onChange={(event) => setConsent(event.target.checked)} className="mt-1.5 h-4 w-4 shrink-0 accent-violet-600" />
                <span>I reviewed all three sections, removed personal and confidential information, and consent to sending this text to Google Gemini. Results are saved privately and can be deleted later.</span>
              </label>
              <button type="button" disabled={!consent || !lengthsValid || !!busy} onClick={runAnalysis} className="app-button-ai mt-4 w-full disabled:opacity-50 sm:w-auto">
                <Sparkles size={18} aria-hidden="true" />Analyze with Gemini AI
              </button>
            </div>
          </>}
        </>}

        {error && !deleteTarget && <p role="alert" className="app-notice-error">{error}</p>}

        {result && <div className="space-y-5" aria-live="polite">
          <h3 className="flex items-center gap-2 text-lg font-semibold"><Sparkles size={20} aria-hidden="true" className="text-violet-600" />Your AI analysis results</h3>
          <p className="text-sm text-slate-600">{result.resume_name} compared with {result.job_title} at {result.company} · {new Date(result.created_at).toLocaleString()}</p>
          <p className="text-xs text-slate-500">Saved snapshot of this comparison. Later changes to the job or resume do not update this result.</p>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-3xl font-bold text-blue-700">{result.score}/100</p>
            <p className="mt-1 text-sm text-slate-600">Estimated document alignment—not a hiring prediction or ATS score.</p>
            <p className="mt-3">{result.summary}</p>
          </div>
          <section><h3 className="font-semibold">Matching qualifications</h3>
            {!result.matches.length && <p className="mt-2 text-sm text-slate-600">No supported matches were identified.</p>}
            {result.matches.map((match, index) => <div key={index} className="mt-3 rounded-lg border border-slate-200 p-3"><p className="font-medium">{match.requirement}</p><p className="mt-1 text-sm text-slate-600">Profile evidence: “{match.evidence}”</p></div>)}
          </section>
          <section><h3 className="font-semibold">Requirements not evidenced</h3><p className="mt-1 text-xs text-slate-500">These may be missing from the text, not necessarily from your experience.</p><ul className="mt-2 list-disc space-y-2 pl-5">{result.gaps.map((gap, index) => <li key={index}>{gap}</li>)}</ul></section>
          <section><h3 className="font-semibold">Suggested improvements</h3><ul className="mt-2 list-disc space-y-2 pl-5">{result.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}</ul></section>
          <p className="text-sm text-slate-500">Review AI suggestions for accuracy. Only add claims you can support. This result is saved privately in your history.</p>
          {job.latestAnalysisIsStale && <OutdatedAnalysisWarning reasons={job.latestAnalysisStaleReasons} message="Analyze again before applying for the most accurate comparison. You can still continue with this resume if you have reviewed it yourself." />}
          <div className="flex flex-wrap gap-3">
            {result.resume_id && <button type="button" onClick={() => openPrefilledApplication(result.resume_id!)} className="app-button-primary">{job.latestAnalysisIsStale ? "Continue with this resume" : "Add application using this resume"}</button>}
            <button type="button" onClick={() => { setResult(null); setConsent(false); }} className="app-button-secondary">{view === "history" ? "Back to history" : "Review text again"}</button>
          </div>
        </div>}
      </div>
    </dialog>
  );
}
