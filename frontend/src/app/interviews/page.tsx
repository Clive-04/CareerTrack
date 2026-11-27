"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { CalendarPlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import ActionMenu from "@/components/ActionMenu";
import { useApplications } from "@/components/ApplicationsProvider";
import {
  useInterviews,
  type Interview,
  type InterviewStatus,
  type InterviewType,
} from "@/components/InterviewsProvider";
import useDialogControls from "@/hooks/useDialogControls";
import ExpandableText from "@/components/ExpandableText";
import { isInterviewStage } from "@/lib/applicationStatus";

const INTERVIEW_STATUSES: InterviewStatus[] = ["Scheduled", "Completed", "Cancelled"];
const INTERVIEW_TYPES: InterviewType[] = ["Video", "Phone", "On-site"];

const emptyForm = {
  applicationId: "",
  date: "",
  time: "",
  type: "Video" as InterviewType,
  location: "",
  status: "Scheduled" as InterviewStatus,
  notes: "",
};

function formatTime(time: string) {
  if (!time) return "Time not set";
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function meetingUrl(location: string) {
  try {
    const url = new URL(location.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

const statusChip: Record<InterviewStatus, string> = {
  Scheduled: "app-chip-active",
  Completed: "app-chip-success",
  Cancelled: "app-chip-closed",
};

export default function InterviewsPage() {
  const {
    interviews,
    createInterview,
    updateInterview,
    updateInterviewStatus,
    deleteInterview,
    isLoading: interviewsLoading,
    error: interviewsError,
  } = useInterviews();
  const { applications, isLoading: applicationsLoading } = useApplications();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<Interview | null>(null);

  useDialogControls(showModal && !saving, closeModal);
  useDialogControls(interviewToDelete !== null, () => setInterviewToDelete(null));

  const today = new Date().toLocaleDateString("en-CA");

  const applicationsReadyToSchedule = useMemo(() => {
    const withInterviews = new Set(interviews.map((interview) => interview.applicationId));
    return applications.filter(
      (application) => isInterviewStage(application.status) && !withInterviews.has(application.id),
    );
  }, [applications, interviews]);

  const filteredInterviews = useMemo(
    () =>
      interviews
        .filter((interview) => {
          const text = `${interview.company} ${interview.position} ${interview.location}`.toLowerCase();
          return text.includes(search.toLowerCase()) && (statusFilter === "All" || interview.status === statusFilter);
        })
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    [interviews, search, statusFilter],
  );

  const upcoming = filteredInterviews.filter((interview) => interview.status === "Scheduled" && interview.date >= today);
  const past = filteredInterviews
    .filter((interview) => !(interview.status === "Scheduled" && interview.date >= today))
    .reverse();
  const filtersActive = search !== "" || statusFilter !== "All";

  function openAddModal(applicationId?: string) {
    setError("");
    setEditingId(null);
    setForm({ ...emptyForm, applicationId: applicationId ?? applicationsReadyToSchedule[0]?.id ?? applications[0]?.id ?? "" });
    setShowModal(true);
  }

  function openEditModal(interview: Interview) {
    setError("");
    setEditingId(interview.id);
    setForm({
      applicationId: interview.applicationId,
      date: interview.date,
      time: interview.time,
      type: interview.type,
      location: interview.location,
      status: interview.status,
      notes: interview.notes,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.applicationId) {
      setError("Choose the application this interview is for.");
      return;
    }
    if (!form.date || !form.time) {
      setError("Enter both the date and the time.");
      return;
    }

    const interviewData = { ...form, location: form.location.trim(), notes: form.notes.trim() };

    setSaving(true);
    try {
      setError("");
      if (editingId !== null) {
        await updateInterview(editingId, interviewData);
        setNotice("Interview updated.");
      } else {
        await createInterview(interviewData);
        setNotice("Interview scheduled.");
      }
      closeModal();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The interview could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(interview: Interview, status: InterviewStatus) {
    setPageError("");
    try {
      await updateInterviewStatus(interview.id, status);
      setNotice(`Marked the ${interview.company} interview as ${status.toLowerCase()}.`);
    } catch (requestError) {
      setPageError(requestError instanceof Error ? requestError.message : "The status could not be changed. Try again.");
    }
  }

  async function confirmDeleteInterview() {
    if (!interviewToDelete) return;
    try {
      await deleteInterview(interviewToDelete.id);
      setNotice("Interview deleted.");
      setInterviewToDelete(null);
    } catch (requestError) {
      setPageError(requestError instanceof Error ? requestError.message : "The interview could not be deleted. Try again.");
      setInterviewToDelete(null);
    }
  }

  function renderInterview(interview: Interview) {
    const date = new Date(`${interview.date}T00:00:00`);
    const link = meetingUrl(interview.location);

    return (
      <li key={interview.id}>
        <article aria-labelledby={`interview-${interview.id}-title`} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
          <time
            dateTime={interview.date}
            className="flex w-14 shrink-0 flex-col items-center rounded-md border border-slate-200 py-1.5 leading-tight"
          >
            <span className="text-xs text-slate-500">{date.toLocaleDateString("en-US", { month: "short" })}</span>
            <span className="text-xl font-semibold tabular-nums text-slate-900">{date.getDate()}</span>
            <span className="text-xs text-slate-500">{date.toLocaleDateString("en-US", { weekday: "short" })}</span>
          </time>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id={`interview-${interview.id}-title`} className="text-[1.0625rem] font-semibold text-slate-900">
                {interview.position}
              </h3>
              <span className={`app-chip ${statusChip[interview.status]}`}>{interview.status}</span>
            </div>
            <p className="text-[0.9375rem] text-slate-700">{interview.company}</p>
            <p className="mt-1.5 text-sm text-slate-500">
              <span className="tabular-nums">{formatTime(interview.time)}</span> · {interview.type}
              {interview.location && !link && <> · {interview.location}</>}
            </p>
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer" className="app-button-text mt-1 break-all">
                Open meeting link
              </a>
            )}
            {interview.notes && (
              <div className="mt-2 max-w-[72ch] text-sm text-slate-600">
                <ExpandableText text={interview.notes} label="Notes" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`interview-status-${interview.id}`}>
              Status for the {interview.company} interview
            </label>
            <select
              id={`interview-status-${interview.id}`}
              value={interview.status}
              onChange={(event) => updateStatus(interview, event.target.value as InterviewStatus)}
              className="form-input !min-h-9 !py-1.5 text-sm sm:w-36"
            >
              {INTERVIEW_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <ActionMenu
              label={`More actions for the ${interview.company} interview`}
              items={[
                { label: "Edit interview", icon: Pencil, onSelect: () => openEditModal(interview) },
                "separator",
                { label: "Delete interview", icon: Trash2, tone: "danger", onSelect: () => setInterviewToDelete(interview) },
              ]}
            />
          </div>
        </article>
      </li>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="app-page space-y-6">
        <PageHeader
          title="Interviews"
          description="Your schedule, and a record of each conversation."
          action={
            <button type="button" onClick={() => openAddModal()} disabled={applications.length === 0} className="app-button-primary">
              <Plus size={18} aria-hidden="true" />
              Schedule interview
            </button>
          }
        />

        {notice && (
          <p role="status" className="app-notice-success justify-between">
            {notice}
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message" className="app-icon-button-ghost -my-1 rounded p-1">
              <X size={16} aria-hidden="true" />
            </button>
          </p>
        )}
        {(interviewsLoading || applicationsLoading) && interviews.length === 0 && (
          <div role="status" className="app-loading-state"><span className="app-spinner" aria-hidden="true" />Loading interviews…</div>
        )}
        {interviewsError && <p role="alert" className="app-notice-error">{interviewsError}</p>}
        {pageError && <p role="alert" className="app-notice-error">{pageError}</p>}

        {applicationsReadyToSchedule.length > 0 && (
          <section aria-labelledby="ready-title" className="app-surface border-l-[3px] border-l-cyan-600">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 id="ready-title" className="app-section-title">Ready to schedule</h2>
              <p className="mt-1 text-sm text-slate-500">These applications are at an interview stage but have no interview recorded.</p>
            </div>
            <ul className="divide-y divide-slate-200">
              {applicationsReadyToSchedule.map((application) => (
                <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <p className="min-w-0 text-[0.9375rem]">
                    <span className="font-medium text-slate-900">{application.position}</span>
                    <span className="text-slate-600"> at {application.company}</span>
                  </p>
                  <button type="button" onClick={() => openAddModal(application.id)} className="app-button-secondary app-button-compact">
                    <CalendarPlus size={16} aria-hidden="true" />Schedule
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!interviewsLoading && interviews.length === 0 && !interviewsError ? (
          <div className="app-empty-state">
            <h2 className="app-section-title">No interviews yet</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-slate-500">
              {applications.length === 0
                ? "Interviews belong to an application. Track an application first."
                : "Record each interview’s date, format, and notes to prepare and follow up."}
            </p>
            {applications.length === 0 ? (
              <Link href="/applications" className="app-button-secondary mt-5">Go to applications</Link>
            ) : (
              <button type="button" onClick={() => openAddModal()} className="app-button-secondary mt-5">
                <Plus size={17} aria-hidden="true" />Schedule an interview
              </button>
            )}
          </div>
        ) : interviews.length > 0 && (
          <>
            <section aria-label="Filter interviews" className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="app-search-control flex flex-1 items-center gap-2 border px-3">
                <Search size={17} className="text-slate-500" aria-hidden="true" />
                <input
                  aria-label="Search interviews"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search company, role, or location"
                  className="h-11 w-full min-w-0 bg-transparent text-[0.9375rem] outline-none"
                />
              </label>
              <select
                aria-label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="form-input sm:w-44"
              >
                <option value="All">All statuses</option>
                {INTERVIEW_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </section>

            <div className="app-filter-summary !mt-0">
              <p aria-live="polite">
                Showing <span className="font-semibold text-slate-800">{filteredInterviews.length}</span> of {interviews.length} interviews
              </p>
              {filtersActive && (
                <button type="button" onClick={() => { setSearch(""); setStatusFilter("All"); }} className="app-button-text">Clear filters</button>
              )}
            </div>

            {filteredInterviews.length === 0 && (
              <div className="app-empty-state">
                <p className="font-medium text-slate-800">No interviews match these filters</p>
              </div>
            )}

            {upcoming.length > 0 && (
              <section aria-labelledby="upcoming-title">
                <h2 id="upcoming-title" className="app-section-title mb-3">Upcoming</h2>
                <ul className="app-surface divide-y divide-slate-200">{upcoming.map(renderInterview)}</ul>
              </section>
            )}

            {past.length > 0 && (
              <section aria-labelledby="past-title">
                <h2 id="past-title" className="app-section-title mb-3">Past and closed</h2>
                <ul className="app-surface divide-y divide-slate-200">{past.map(renderInterview)}</ul>
              </section>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="app-modal-backdrop app-modal-backdrop-scroll">
          <div role="dialog" aria-modal="true" aria-labelledby="interview-form-title" className="app-modal-panel app-modal-sheet my-auto max-w-xl">
            <div className="app-modal-header">
              <div>
                <h2 id="interview-form-title" className="text-xl font-semibold">
                  {editingId !== null ? "Edit interview" : "Schedule interview"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">When it is, how it happens, and what to remember.</p>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} aria-label="Close" className="app-icon-button app-icon-button-ghost">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form noValidate onSubmit={handleSubmit} className="space-y-5 p-6">
              <FormField label="Application" required>
                <select
                  required
                  data-autofocus
                  disabled={editingId !== null}
                  value={form.applicationId}
                  onChange={(event) => setForm({ ...form, applicationId: event.target.value })}
                  aria-invalid={error !== "" && !form.applicationId}
                  className="form-input"
                >
                  <option value="">{applications.length === 0 ? "No applications yet" : "Choose an application"}</option>
                  {applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.position} at {application.company}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Date" required>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm({ ...form, date: event.target.value })}
                    aria-invalid={error !== "" && !form.date}
                    className="form-input"
                  />
                </FormField>
                <FormField label="Time" required>
                  <input
                    required
                    type="time"
                    value={form.time}
                    onChange={(event) => setForm({ ...form, time: event.target.value })}
                    aria-invalid={error !== "" && !form.time}
                    className="form-input"
                  />
                </FormField>
                <FormField label="Format">
                  <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as InterviewType })} className="form-input">
                    {INTERVIEW_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </FormField>
                <FormField label="Status">
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as InterviewStatus })} className="form-input">
                    {INTERVIEW_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="Location or meeting link">
                <input
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  placeholder="Office address, or a https:// meeting link"
                  className="form-input"
                />
              </FormField>

              <FormField label="Notes">
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Who you’re meeting, what to prepare, how it went"
                  className="form-input resize-y"
                />
              </FormField>

              {error && <p role="alert" className="app-notice-error">{error}</p>}

              <div className="app-modal-footer">
                <button type="button" onClick={closeModal} disabled={saving} className="app-button-secondary">Cancel</button>
                <button type="submit" disabled={saving || applications.length === 0} aria-busy={saving} className="app-button-primary">
                  {saving && <span className="app-spinner !border-white/30 !border-t-white" aria-hidden="true" />}
                  {editingId !== null ? "Save changes" : "Schedule interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {interviewToDelete && (
        <div className="app-modal-backdrop !z-[80]">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-interview-title"
            aria-describedby="delete-interview-description"
            className="app-modal-panel max-w-md p-6"
          >
            <h2 id="delete-interview-title" className="text-lg font-semibold text-slate-900">Delete this interview?</h2>
            <p id="delete-interview-description" className="mt-2 text-[0.9375rem] leading-6 text-slate-600">
              The {interviewToDelete.type.toLowerCase()} interview with {interviewToDelete.company} and its notes will be permanently deleted. The application stays. This can’t be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" data-autofocus onClick={() => setInterviewToDelete(null)} className="app-button-secondary">Cancel</button>
              <button type="button" onClick={confirmDeleteInterview} className="app-button-danger">Delete interview</button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}

function FormField({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="app-field-label">
        {label}
        {required ? <span className="font-normal text-slate-500"> (required)</span> : null}
      </span>
      {children}
    </label>
  );
}
