"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Sparkles, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useResumes } from "@/components/ResumesProvider";
import AnalysisDeleteModal from "@/components/AnalysisDeleteModal";
import OutdatedAnalysisWarning from "@/components/OutdatedAnalysisWarning";
import type { Job } from "@/components/JobsProvider";
import { analyzeResume, previewAnalysis, getAnalysisHistory, deleteAnalysisHistory, type AnalysisPreview, type ResumeAnalysis } from "@/lib/api";
import { countWords, MIN_JOB_WORDS } from "@/lib/jobDescription";

export default function ResumeAnalysisDialog({ job, onClose, onAnalysisChange, initialView = "new" }: { job: Job; onClose: () => void; onAnalysisChange?: () => void | Promise<void>; initialView?: "new" | "history" }) {
  const { token } = useAuth();
  const { resumes } = useResumes();
  const ready = resumes.filter((resume) => resume.hasFile && resume.extractionStatus === "ready");
  const [resumeId, setResumeId] = useState(ready.find((resume) => resume.isDefault)?.id ?? ready[0]?.id ?? "");
  const [preview, setPreview] = useState<AnalysisPreview | null>(null);
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
    try { setPreview(await previewAnalysis(token, job.id, resumeId)); }
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

  const lengthsValid = preview && preview.resume_text.trim().length >= 50 && preview.resume_text.length <= 40000
    && countWords(preview.job_description) >= MIN_JOB_WORDS && preview.job_description.length <= 20000;
  const inputClass = "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 focus:outline-blue-500 disabled:opacity-60";

  return (
    <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); if (!busy && !deleting) { if (deleteTarget) setDeleteTarget(null); else onClose(); } }}
      aria-labelledby="analysis-title" className="m-auto max-h-[90vh] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"><Sparkles size={14} aria-hidden="true" />Powered by Gemini AI</span>
          <h2 id="analysis-title" className="text-xl font-bold">AI Resume Analysis</h2>
          <p className="mt-1 text-sm text-slate-600">{job.position} at {job.company}</p>
          <p className="mt-2 text-sm text-slate-500">Compare your resume with this job using AI to find matching qualifications, gaps, and improvements.</p>
        </div>
        <button type="button" disabled={!!busy || deleting} aria-label="Close analysis" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-40"><X size={20} /></button>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex gap-2 border-b pb-3">
          {(["new", "history"] as const).map((tab) => <button key={tab} type="button" disabled={!!busy || deleting} aria-pressed={view === tab}
            onClick={() => { setView(tab); setResult(null); setConsent(false); setDeleteTarget(null); setError(""); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === tab ? "bg-violet-100 text-violet-800" : "text-slate-600 hover:bg-slate-100"}`}>
            {tab === "new" ? "New analysis" : "Saved history"}
          </button>)}
        </div>
        {view === "history" && !result && <section className="space-y-3">
          {historyLoading && <p role="status">Loading analysis history...</p>}
          {historyError && <p role="alert" className="text-sm text-red-600">{historyError}</p>}
          {!historyLoading && !historyError && !history.length && <p className="text-sm text-slate-600">No saved analyses yet. Completed analyses will appear here.</p>}
          {history.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4">
            <p className="font-semibold">{item.resume_name} · {item.score}/100</p>
            <p className="mt-1 text-sm text-slate-500">{item.job_title} at {item.company} · {new Date(item.created_at).toLocaleString()}</p>
            <div className="mt-3 flex gap-3">
              <button type="button" disabled={deleting} onClick={() => { setResult(item); setDeleteTarget(null); }} className="rounded-lg border px-3 py-2 text-sm font-semibold text-blue-700">View result</button>
              <button type="button" disabled={deleting} onClick={() => { setDeleteTarget(item); setError(""); }} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">Delete</button>
            </div>
          </article>)}
        </section>}
        {deleteTarget && <AnalysisDeleteModal resumeName={deleteTarget.resume_name} deleting={deleting} error={error} onCancel={() => { setDeleteTarget(null); setError(""); }} onConfirm={confirmDelete} />}
        {busy === "analysis" && (
          <div role="status" aria-live="polite" className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-violet-100 bg-violet-50/60 px-6 py-10 text-center">
            <LoaderCircle size={40} aria-hidden="true" className="motion-safe:animate-spin text-violet-600" />
            <h3 className="mt-5 text-lg font-semibold text-slate-900">Gemini AI is analyzing your resume</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Comparing the reviewed resume text with the job requirements to identify relevant experience and suggested improvements.</p>
            <p className="mt-4 text-xs text-slate-500">This may take up to two minutes on Gemini&apos;s free tier. Your results will appear here when ready.</p>
          </div>
        )}

        {view === "new" && !result && busy !== "analysis" && <>
          {countWords(job.description) < MIN_JOB_WORDS && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Edit this saved job first: its description needs at least 50 words with specific responsibilities and requirements.</p>}
          <label className="block text-sm font-medium" htmlFor="analysis-resume">Resume</label>
          <select id="analysis-resume" className={inputClass} disabled={!!busy} value={resumeId}
            onChange={(event) => { setResumeId(event.target.value); setPreview(null); setConsent(false); setError(""); }}>
            <option value="">Choose a resume with extracted text</option>
            {ready.map((resume) => <option key={resume.id} value={resume.id}>{resume.name}</option>)}
          </select>
          {!ready.length && <p className="text-sm text-amber-700">Upload a readable resume and extract its text on the <Link href="/resumes" className="underline">Resumes page</Link> first.</p>}

          {!preview && <button type="button" onClick={loadPreview} disabled={!resumeId || !!busy || countWords(job.description) < MIN_JOB_WORDS}
            className="app-button-primary disabled:opacity-50">{busy ? "Preparing text..." : "Review text before sending"}</button>}

          {preview && <>
            <div className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Gemini free-tier content may be used to improve Google products and reviewed by people. Google advises against submitting personal, sensitive, or confidential information.
              Common contact details have been removed automatically, but this is incomplete. Remove remaining names, addresses, identifiers, and confidential details from both fields. Use an anonymized or sample resume for free-tier testing.
              {" "}<a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer" className="underline">Read Google’s data terms</a>.
            </div>
            <p className="text-sm text-slate-600">Only the text below is sent to Google Gemini when you click Analyze. Editing it here does not change your stored resume or job. Nothing is sent while you review.</p>
            <label className="block text-sm font-medium" htmlFor="analysis-resume-text">Resume text ({preview.resume_text.length}/40,000 characters)</label>
            <textarea id="analysis-resume-text" rows={8} disabled={!!busy} className={inputClass} value={preview.resume_text}
              onChange={(event) => { setPreview({ ...preview, resume_text: event.target.value }); setConsent(false); }} />
            <label className="block text-sm font-medium" htmlFor="analysis-job-text">Job requirements ({countWords(preview.job_description)} words / 50 minimum; {preview.job_description.length}/20,000 characters)</label>
            <textarea id="analysis-job-text" rows={5} disabled={!!busy} className={inputClass} value={preview.job_description}
              onChange={(event) => { setPreview({ ...preview, job_description: event.target.value }); setConsent(false); }} />
            {!lengthsValid && <p className="text-sm text-amber-700">The resume needs at least 50 characters; job requirements need at least 50 words. Shorten text exceeding the displayed character limits.</p>}
            <p className="text-sm text-slate-600">Completed results, including quoted evidence, are saved privately to your analysis history. You can delete them later.</p>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={consent} disabled={!!busy} onChange={(event) => setConsent(event.target.checked)} className="mt-1" />
              I reviewed both fields, removed personal and confidential information, and consent to sending this text to Google Gemini for this analysis.
            </label>
            <button type="button" disabled={!consent || !lengthsValid || !!busy} onClick={runAnalysis} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
              <Sparkles size={18} aria-hidden="true" />Analyze with Gemini AI
            </button>
          </>}
        </>}

        {error && !deleteTarget && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

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
            {result.matches.map((match, index) => <div key={index} className="mt-3 rounded-lg border border-slate-200 p-3"><p className="font-medium">{match.requirement}</p><p className="mt-1 text-sm text-slate-600">Resume evidence: “{match.evidence}”</p></div>)}
          </section>
          <section><h3 className="font-semibold">Requirements not evidenced</h3><p className="mt-1 text-xs text-slate-500">These may be missing from the text, not necessarily from your experience.</p><ul className="mt-2 list-disc space-y-2 pl-5">{result.gaps.map((gap, index) => <li key={index}>{gap}</li>)}</ul></section>
          <section><h3 className="font-semibold">Suggested improvements</h3><ul className="mt-2 list-disc space-y-2 pl-5">{result.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}</ul></section>
          <p className="text-sm text-slate-500">Review AI suggestions for accuracy. Only add claims you can support. This result is saved privately in your history.</p>
          {job.latestAnalysisIsStale && <OutdatedAnalysisWarning reasons={job.latestAnalysisStaleReasons} message="Analyze again before applying for the most accurate comparison. You can still continue with this resume if you have reviewed it yourself." />}
          <div className="flex flex-wrap gap-3">
            {result.resume_id && <Link href={`/applications?job=${encodeURIComponent(job.id)}&resume=${encodeURIComponent(result.resume_id)}`} className="app-button-primary">{job.latestAnalysisIsStale ? "Continue with this resume" : "Add application using this resume"}</Link>}
            <button type="button" onClick={() => { setResult(null); setConsent(false); }} className="rounded-lg border px-4 py-2 font-medium">{view === "history" ? "Back to history" : "Review text again"}</button>
          </div>
        </div>}
      </div>
    </dialog>
  );
}
