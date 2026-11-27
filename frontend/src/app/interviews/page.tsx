"use client";

import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { CalendarPlus, ExternalLink, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import ActionMenu from "@/components/ActionMenu";
import { StatusChip } from "@/components/CareerTrack";
import FormField, { fieldProps, focusFirstInvalid } from "@/components/FormField";
import { ListSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/ToastProvider";
import { useApplications } from "@/components/ApplicationsProvider";
import {
  useInterviews,
  type Interview,
  type InterviewStatus,
  type InterviewType,
} from "@/components/InterviewsProvider";
import useDialogControls from "@/hooks/useDialogControls";
import useNewIds from "@/hooks/useNewIds";
import ExpandableText from "@/components/ExpandableText";
import { isInterviewStage } from "@/lib/applicationStatus";
import { daysBetween, formatTime, relativeDay } from "@/lib/nextSteps";

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
type InterviewForm = typeof emptyForm;
type FormErrors = Partial<Record<"applicationId" | "date" | "time", string>>;

function validate(form: InterviewForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.applicationId) errors.applicationId = "Choose the application this interview is for.";
  if (!form.date) errors.date = "Enter the interview date.";
  if (!form.time) errors.time = "Enter the start time.";
  return errors;
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
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [attempted, setAttempted] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [saving, setSaving] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<Interview | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const newIds = useNewIds(interviews.map((interview) => interview.id), interviewsLoading);

  useDialogControls(showModal && !saving, closeModal);
  useDialogControls(interviewToDelete !== null, () => setInterviewToDelete(null));

  const today = new Date().toLocaleDateString("en-CA");
  const applicationById = useMemo(() => new Map(applications.map((application) => [application.id, application])), [applications]);

  const applicationsReadyToSchedule = useMemo(() => {
    const withInterviews = new Set(interviews.map((interview) => interview.applicationId));
    return applications.filter((application) => isInterviewStage(application.status) && !withInterviews.has(application.id));
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

  // Schedule groups: time is the organizing principle on this page.
  const upcoming = filteredInterviews.filter((interview) => interview.status === "Scheduled" && interview.date >= today);
  const groups = [
    { key: "today", title: "Today", items: upcoming.filter((interview) => daysBetween(today, interview.date) === 0) },
    { key: "tomorrow", title: "Tomorrow", items: upcoming.filter((interview) => daysBetween(today, interview.date) === 1) },
    { key: "week", title: "Later this week", items: upcoming.filter((interview) => { const days = daysBetween(today, interview.date); return days >= 2 && days <= 7; }) },
    { key: "later", title: "Later", items: upcoming.filter((interview) => daysBetween(today, interview.date) > 7) },
  ];
  const past = filteredInterviews.filter((interview) => !(interview.status === "Scheduled" && interview.date >= today)).reverse();
  const filtersActive = search !== "" || statusFilter !== "All";

  function openAddModal(applicationId?: string) {
    setEditingId(null);
    setForm({ ...emptyForm, applicationId: applicationId ?? applicationsReadyToSchedule[0]?.id ?? "" });
    setAttempted(false);
    setRequestError("");
    setShowModal(true);
  }

  function openEditModal(interview: Interview) {
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
    setAttempted(false);
    setRequestError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setAttempted(false);
    setRequestError("");
  }

  const errors = attempted ? validate(form) : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (Object.keys(validate(form)).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setSaving(true);
    setRequestError("");
    try {
      const interviewData = { ...form, location: form.location.trim(), notes: form.notes.trim() };
      if (editingId !== null) {
        await updateInterview(editingId, interviewData);
        toast("Interview updated.");
      } else {
        await createInterview(interviewData);
        toast("Interview scheduled.");
      }
      closeModal();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "The interview could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(interview: Interview, status: InterviewStatus) {
    try {
      await updateInterviewStatus(interview.id, status);
      toast(`${interview.company} interview marked ${status.toLowerCase()}.`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "The status could not be changed. Try again.", "error");
    }
  }

  async function confirmDeleteInterview() {
    if (!interviewToDelete) return;
    try {
      await deleteInterview(interviewToDelete.id);
      toast("Interview deleted.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "The interview could not be deleted. Try again.", "error");
    }
    setInterviewToDelete(null);
  }

  function renderInterview(interview: Interview, showDate: boolean) {
    const link = meetingUrl(interview.location);
    const application = applicationById.get(interview.applicationId);

    return (
      <li key={interview.id} className={newIds.has(interview.id) ? "app-item-new" : undefined}>
        <article
          aria-labelledby={`interview-${interview.id}-title`}
          className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 px-5 py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:px-6"
        >
          <time dateTime={`${interview.date}T${interview.time}`} className="text-sm leading-5">
            {showDate && (
              <span className="block font-medium text-slate-900">
                {new Date(`${interview.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
            <span className={`block tabular-nums ${showDate ? "text-slate-500" : "font-semibold text-slate-900"}`}>{formatTime(interview.time)}</span>
            <span className="block text-slate-500">{interview.type}</span>
          </time>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id={`interview-${interview.id}-title`} className="font-semibold text-slate-900">{interview.company}</h3>
              {interview.status !== "Scheduled" && <span className={`app-chip ${statusChip[interview.status]}`}>{interview.status}</span>}
            </div>
            <p className="text-[0.9375rem] text-slate-700">{interview.position}</p>
            {application && (
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                Application <StatusChip status={application.status} />
              </p>
            )}
            {interview.location && !link && <p className="mt-1 text-sm text-slate-600">{interview.location}</p>}
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer" className="app-button-text mt-1">
                Open meeting link <ExternalLink size={14} aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
            {interview.notes && (
              <div className="mt-2 max-w-[68ch] border-l-2 border-slate-200 pl-3 text-sm text-slate-700">
                <p className="text-[0.8125rem] font-medium text-slate-500">Preparation notes</p>
                <ExpandableText text={interview.notes} collapsedLines={3} />
              </div>
            )}
          </div>

          <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:items-start">
            <label className="sr-only" htmlFor={`interview-status-${interview.id}`}>Status for the {interview.company} interview</label>
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

  const loading = (interviewsLoading || applicationsLoading) && interviews.length === 0;
  const nextInterview = upcoming[0];

  return (
    <WorkspaceLayout>
      <div className="app-page space-y-8">
        <PageHeader
          title="Interviews"
          description={
            nextInterview
              ? `Next: ${nextInterview.company}, ${relativeDay(nextInterview.date, today).toLowerCase()} at ${formatTime(nextInterview.time)}.`
              : "Your schedule, and a record of each conversation."
          }
          action={
            <button
              type="button"
              onClick={() => openAddModal()}
              disabled={applications.length === 0}
              title={applications.length === 0 ? "Track an application first" : undefined}
              className="app-button-primary"
            >
              <Plus size={18} aria-hidden="true" />
              Schedule interview
            </button>
          }
        />

        {interviewsError && <p role="alert" className="app-notice-error">{interviewsError}</p>}
        {loading && <ListSkeleton rows={3} label="Loading interviews" />}

        {!loading && (
          <div className="app-enter space-y-8" style={{ "--i": 1 } as CSSProperties}>
            {applicationsReadyToSchedule.length > 0 && (
              <section aria-labelledby="ready-title">
                <h2 id="ready-title" className="app-section-title">Ready to schedule</h2>
                <p className="mt-1 text-sm text-slate-600">These applications reached an interview stage but have no interview recorded.</p>
                <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                  {applicationsReadyToSchedule.map((application) => (
                    <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
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
                <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-slate-600">
                  {applications.length === 0
                    ? "Interviews belong to an application. Track an application first."
                    : "Record each interview’s date, format, and preparation notes."}
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
                  <select aria-label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="form-input sm:w-44">
                    <option value="All">All statuses</option>
                    {INTERVIEW_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </section>

                {filtersActive && (
                  <div className="app-filter-summary !mt-0">
                    <p aria-live="polite">
                      Showing <span className="font-semibold text-slate-800">{filteredInterviews.length}</span> of {interviews.length} interviews
                    </p>
                    <button type="button" onClick={() => { setSearch(""); setStatusFilter("All"); }} className="app-button-text">Clear filters</button>
                  </div>
                )}

                {filteredInterviews.length === 0 && (
                  <div className="app-empty-state"><p className="font-medium text-slate-800">No interviews match these filters</p></div>
                )}

                {upcoming.length === 0 && filteredInterviews.length > 0 && !filtersActive && (
                  <p className="text-[0.9375rem] text-slate-600">Nothing scheduled. Past interviews are listed below.</p>
                )}

                {groups.filter((group) => group.items.length > 0).map((group) => (
                  <section key={group.key} aria-labelledby={`group-${group.key}`}>
                    <h2 id={`group-${group.key}`} className="app-section-title mb-3">{group.title}</h2>
                    <ul className="app-surface divide-y divide-slate-200">
                      {group.items.map((interview) => renderInterview(interview, group.key !== "today" && group.key !== "tomorrow"))}
                    </ul>
                  </section>
                ))}

                {past.length > 0 && (
                  <details className="group" open={filtersActive || upcoming.length === 0}>
                    <summary className="app-section-title flex cursor-pointer list-none items-center gap-2 rounded py-1">
                      <span aria-hidden="true" className="text-slate-500 transition-transform group-open:rotate-90">›</span>
                      Past and cancelled <span className="font-normal text-slate-500">({past.length})</span>
                    </summary>
                    <ul className="app-surface mt-3 divide-y divide-slate-200">{past.map((interview) => renderInterview(interview, true))}</ul>
                  </details>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="app-modal-backdrop app-modal-backdrop-scroll">
          <div role="dialog" aria-modal="true" aria-labelledby="interview-form-title" className="app-modal-panel app-modal-sheet my-auto max-w-xl">
            <div className="app-modal-header">
              <div>
                <h2 id="interview-form-title" className="text-xl font-semibold">{editingId !== null ? "Edit interview" : "Schedule interview"}</h2>
                <p className="mt-1 text-sm text-slate-500">When it is, how it happens, and how to prepare.</p>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} aria-label="Close" title="Close" className="app-icon-button app-icon-button-ghost">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-5 p-6">
              <FormField id="interview-application" label="Application" required error={errors.applicationId}>
                <select
                  {...fieldProps("interview-application", errors.applicationId)}
                  data-autofocus
                  disabled={editingId !== null}
                  value={form.applicationId}
                  onChange={(event) => setForm({ ...form, applicationId: event.target.value })}
                  className="form-input"
                >
                  <option value="">{applications.length === 0 ? "No applications yet" : "Choose an application"}</option>
                  {applications.map((application) => (
                    <option key={application.id} value={application.id}>{application.position} at {application.company}</option>
                  ))}
                </select>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField id="interview-date" label="Date" required error={errors.date}>
                  <input {...fieldProps("interview-date", errors.date)} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="form-input" />
                </FormField>
                <FormField id="interview-time" label="Time" required error={errors.time}>
                  <input {...fieldProps("interview-time", errors.time)} type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="form-input" />
                </FormField>
                <FormField id="interview-type" label="Format">
                  <select id="interview-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as InterviewType })} className="form-input">
                    {INTERVIEW_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </FormField>
                <FormField id="interview-status" label="Status">
                  <select id="interview-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as InterviewStatus })} className="form-input">
                    {INTERVIEW_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField id="interview-location" label="Location or meeting link" hint="Paste a https:// link to get a one-click Open meeting link.">
                <input
                  {...fieldProps("interview-location", undefined, true)}
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  className="form-input"
                />
              </FormField>

              <FormField id="interview-notes" label="Preparation notes">
                <textarea
                  id="interview-notes"
                  rows={5}
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Who you’re meeting, what to prepare, how it went"
                  className="form-input resize-y"
                />
              </FormField>

              {requestError && <p role="alert" className="app-notice-error">{requestError}</p>}

              <div className="app-modal-footer">
                <button type="button" onClick={closeModal} disabled={saving} className="app-button-secondary">Cancel</button>
                <button type="submit" disabled={saving} aria-busy={saving} className="app-button-primary">
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
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-interview-title" aria-describedby="delete-interview-description" className="app-modal-panel max-w-md p-6">
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
