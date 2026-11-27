"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { Clock, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import {
  useApplications,
  type Application,
  type ApplicationStatus,
} from "@/components/ApplicationsProvider";
import { useJobs } from "@/components/JobsProvider";
import { useResumes } from "@/components/ResumesProvider";
import { useInterviews } from "@/components/InterviewsProvider";
import OutdatedAnalysisWarning from "@/components/OutdatedAnalysisWarning";
import ExpandableText from "@/components/ExpandableText";
import ActionMenu from "@/components/ActionMenu";
import { CareerTrack } from "@/components/CareerTrack";
import FormField, { fieldProps, focusFirstInvalid } from "@/components/FormField";
import { ListSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/ToastProvider";
import useDialogControls from "@/hooks/useDialogControls";
import useNewIds from "@/hooks/useNewIds";
import { APPLICATION_STATUSES, isClosedStatus } from "@/lib/applicationStatus";
import { daysBetween, FOLLOW_UP_AFTER_DAYS } from "@/lib/nextSteps";

type ApplicationForm = {
  jobId: string;
  dateApplied: string;
  status: ApplicationStatus;
  notes: string;
  resumeId: string;
};
type FormErrors = Partial<Record<"jobId" | "dateApplied", string>>;

const ALL = "All statuses";

const GROUPS: { key: string; title: string; statuses: ApplicationStatus[] }[] = [
  { key: "decide", title: "Needs a decision", statuses: ["Offer"] },
  { key: "progress", title: "In progress", statuses: ["Final interview", "Interview", "Assessment", "Applied"] },
  { key: "saved", title: "Saved, not yet applied", statuses: ["Saved"] },
  { key: "closed", title: "Closed", statuses: ["Rejected", "Withdrawn"] },
];

const emptyForm: ApplicationForm = { jobId: "", dateApplied: "", status: "Applied", notes: "", resumeId: "" };

function getLocalDate() {
  return new Date().toLocaleDateString("en-CA");
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function validate(form: ApplicationForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.jobId) errors.jobId = "Choose the job you applied for.";
  if (!form.dateApplied && form.status !== "Saved") errors.dateApplied = "Enter the date you applied, or set the status to Saved.";
  return errors;
}

export default function ApplicationsPage() {
  const {
    applications,
    createApplication,
    updateApplication,
    deleteApplication,
    isLoading: applicationsLoading,
    error: applicationsError,
  } = useApplications();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { resumes, isLoading: resumesLoading } = useResumes();
  const { interviews } = useInterviews();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [showForm, setShowForm] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const urlHandled = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const newIds = useNewIds(applications.map((application) => application.id), applicationsLoading);
  const today = getLocalDate();

  useDialogControls(showForm && !saving, closeForm);
  useDialogControls(applicationToDelete !== null, () => setApplicationToDelete(null));

  /*
   * Deep links, applied before paint:
   *   ?job=<id>[&resume=<id>]  opens a new application for that job
   *   ?status=<Status>         filters the list
   *   ?q=<text>                pre-fills the search
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (urlHandled.current || jobsLoading || resumesLoading) return;
    urlHandled.current = true;

    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status && (APPLICATION_STATUSES as readonly string[]).includes(status)) setStatusFilter(status);
    const query = params.get("q");
    if (query) setSearch(query.slice(0, 200));

    const jobId = params.get("job") ?? "";
    const resumeId = params.get("resume") ?? "";
    if (jobs.some((job) => job.id === jobId)) {
      setEditingId(null);
      setForm({
        ...emptyForm,
        jobId,
        resumeId: resumes.some((resume) => resume.id === resumeId)
          ? resumeId
          : resumes.find((resume) => resume.isDefault)?.id ?? "",
        dateApplied: getLocalDate(),
      });
      setAttempted(false);
      setRequestError("");
      setShowForm(true);
    }
    if (params.size > 0) window.history.replaceState(null, "", "/applications");
  }, [jobs, jobsLoading, resumes, resumesLoading]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const withInterviews = new Set(interviews.map((interview) => interview.applicationId));
  const filteredApplications = applications
    .filter((application) => {
      const matchesSearch = `${application.company} ${application.position} ${application.location}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesSearch && (statusFilter === ALL || application.status === statusFilter);
    })
    .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied) || b.id.localeCompare(a.id));

  const filtersActive = search !== "" || statusFilter !== ALL;
  const activeCount = applications.filter((application) => !isClosedStatus(application.status) && application.status !== "Offer").length;

  function clearFilters() {
    setSearch("");
    setStatusFilter(ALL);
  }

  function openAddApplication() {
    const trackedJobs = new Set(applications.map((application) => application.jobId));
    setEditingId(null);
    setForm({
      ...emptyForm,
      jobId: jobs.find((job) => !trackedJobs.has(job.id))?.id ?? "",
      dateApplied: getLocalDate(),
      resumeId: resumes.find((resume) => resume.isDefault)?.id ?? "",
    });
    setAttempted(false);
    setRequestError("");
    setShowForm(true);
  }

  function openEditApplication(application: Application) {
    setEditingId(application.id);
    setForm({
      jobId: application.jobId,
      dateApplied: application.dateApplied,
      status: application.status,
      notes: application.notes,
      resumeId: application.resumeId,
    });
    setAttempted(false);
    setRequestError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setAttempted(false);
    setRequestError("");
  }

  const errors = attempted ? validate(form) : {};

  async function handleSaveApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (Object.keys(validate(form)).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setSaving(true);
    setRequestError("");
    try {
      if (editingId !== null) {
        await updateApplication(editingId, { ...form, notes: form.notes.trim() });
        toast("Application updated.");
      } else {
        await createApplication({ ...form, notes: form.notes.trim() });
        toast("Application tracked.");
        clearFilters();
      }
      closeForm();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "The application could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(application: Application, status: ApplicationStatus) {
    setUpdatingId(application.id);
    try {
      await updateApplication(application.id, {
        jobId: application.jobId,
        dateApplied: application.dateApplied || (status === "Saved" ? "" : getLocalDate()),
        status,
        notes: application.notes,
        resumeId: application.resumeId,
      });
      toast(`${application.position} moved to ${status}.`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "The status could not be changed. Try again.", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmDeleteApplication() {
    if (!applicationToDelete) return;
    setDeleteError("");
    try {
      await deleteApplication(applicationToDelete.id);
      toast(`Application for ${applicationToDelete.position} deleted.`);
      setApplicationToDelete(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "The application could not be deleted. Try again.");
    }
  }

  const selectedJob = jobs.find((job) => job.id === form.jobId);
  const deleteInterviewCount = applicationToDelete
    ? interviews.filter((interview) => interview.applicationId === applicationToDelete.id).length
    : 0;

  function renderRow(application: Application) {
    const daysSince = application.dateApplied ? daysBetween(application.dateApplied, today) : null;
    const needsFollowUp = (application.status === "Applied" || application.status === "Assessment")
      && daysSince !== null && daysSince >= FOLLOW_UP_AFTER_DAYS && !withInterviews.has(application.id);

    return (
      <li key={application.id} className={newIds.has(application.id) ? "app-item-new" : undefined}>
        <article
          aria-labelledby={`application-${application.id}-title`}
          className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-6 xl:grid-cols-[minmax(0,1fr)_12rem_auto] xl:items-center"
        >
          <div className="min-w-0">
            <h3 id={`application-${application.id}-title`} className="font-semibold text-slate-900">{application.position}</h3>
            <p className="text-[0.9375rem] text-slate-700">{application.company}</p>
            <p className="mt-1 text-sm text-slate-500">
              {application.dateApplied ? (
                <>Applied <time dateTime={application.dateApplied} className="tabular-nums">{formatDate(application.dateApplied)}</time></>
              ) : "Not applied yet"}
              {application.resumeId && <> · {application.resumeName}</>}
            </p>
            {needsFollowUp && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
                <Clock size={14} aria-hidden="true" />No reply recorded in {daysSince} days
              </p>
            )}
            {application.notes && (
              <div className="mt-2 max-w-[68ch] text-sm text-slate-600"><ExpandableText text={application.notes} /></div>
            )}
          </div>

          {/* The status is named once, in the select; the track shows how far it has come. */}
          <div className="sm:col-start-1 sm:row-start-2 xl:col-start-auto xl:row-start-auto">
            <CareerTrack status={application.status} className="w-full max-w-48" />
          </div>

          <div className="flex items-center gap-2 sm:col-start-2 sm:row-start-1 sm:self-start xl:col-start-auto xl:row-start-auto xl:self-center">
            <label className="sr-only" htmlFor={`status-${application.id}`}>
              Status for {application.position} at {application.company}
            </label>
            <select
              id={`status-${application.id}`}
              value={application.status}
              disabled={updatingId === application.id}
              aria-busy={updatingId === application.id}
              onChange={(event) => changeStatus(application, event.target.value as ApplicationStatus)}
              className="form-input !min-h-9 !py-1.5 text-sm sm:w-44"
            >
              {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <ActionMenu
              label={`More actions for ${application.position} at ${application.company}`}
              items={[
                { label: "Edit application", icon: Pencil, onSelect: () => openEditApplication(application) },
                "separator",
                {
                  label: "Delete application",
                  icon: Trash2,
                  tone: "danger",
                  onSelect: () => { setDeleteError(""); setApplicationToDelete(application); },
                },
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
          title="Applications"
          description={
            applications.length > 0
              ? `${activeCount} in progress. Change the status as each stage happens.`
              : "Jobs you’ve applied for, and where each one stands."
          }
          action={
            <button
              type="button"
              onClick={openAddApplication}
              disabled={jobs.length === 0}
              title={jobs.length === 0 ? "Add a job first" : undefined}
              className="app-button-primary"
            >
              <Plus size={18} aria-hidden="true" />
              Track application
            </button>
          }
        />

        {applicationsError && <p role="alert" className="app-notice-error">{applicationsError}</p>}
        {applicationsLoading && applications.length === 0 && <ListSkeleton rows={5} label="Loading your applications" />}

        {!applicationsLoading && applications.length === 0 && !applicationsError && (
          <div className="app-enter app-empty-state" style={{ "--i": 1 } as CSSProperties}>
            <h2 className="app-section-title">No applications yet</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-slate-600">
              {jobs.length === 0
                ? "Applications are tracked against a saved job. Add the job first."
                : "When you apply for one of your saved jobs, track it here to follow each stage."}
            </p>
            {jobs.length === 0 ? (
              <Link href="/jobs?new=1" className="app-button-secondary mt-5">Add a job</Link>
            ) : (
              <button type="button" onClick={openAddApplication} className="app-button-secondary mt-5">
                <Plus size={17} aria-hidden="true" />Track your first application
              </button>
            )}
          </div>
        )}

        {applications.length > 0 && (
          <div className="app-enter space-y-6" style={{ "--i": 1 } as CSSProperties}>
            <section aria-label="Filter applications" className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="app-search-control flex flex-1 items-center gap-2 border px-3">
                <Search size={17} className="text-slate-500" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search company, role, or location"
                  aria-label="Search applications"
                  className="h-11 w-full min-w-0 bg-transparent text-[0.9375rem] outline-none"
                />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status" className="form-input sm:w-48">
                <option value={ALL}>{ALL}</option>
                {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </section>

            <div className="app-filter-summary !mt-0">
              <p aria-live="polite">
                Showing <span className="font-semibold text-slate-800">{filteredApplications.length}</span> of {applications.length} applications
              </p>
              {filtersActive && <button type="button" onClick={clearFilters} className="app-button-text">Clear filters</button>}
            </div>

            {filteredApplications.length === 0 && (
              <div className="app-empty-state">
                <p className="font-medium text-slate-800">No applications match these filters</p>
                <button type="button" onClick={clearFilters} className="app-button-secondary app-button-compact mt-4">Clear filters</button>
              </div>
            )}

            {GROUPS.map((group) => {
              const items = filteredApplications.filter((application) => group.statuses.includes(application.status));
              if (items.length === 0) return null;
              const heading = (
                <>
                  {group.title} <span className="font-normal text-slate-500">({items.length})</span>
                </>
              );
              if (group.key === "closed") {
                return (
                  <details key={group.key} className="group" open={filtersActive}>
                    <summary className="app-section-title flex cursor-pointer list-none items-center gap-2 rounded py-1 marker:hidden">
                      <span aria-hidden="true" className="text-slate-500 transition-transform group-open:rotate-90">›</span>
                      {heading}
                    </summary>
                    <ul className="app-surface mt-3 divide-y divide-slate-200">{items.map(renderRow)}</ul>
                  </details>
                );
              }
              return (
                <section key={group.key} aria-labelledby={`group-${group.key}`}>
                  <h2 id={`group-${group.key}`} className="app-section-title mb-3">{heading}</h2>
                  <ul className="app-surface divide-y divide-slate-200">{items.map(renderRow)}</ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="app-modal-backdrop app-modal-backdrop-scroll">
          <div role="dialog" aria-modal="true" aria-labelledby="application-form-title" className="app-modal-panel app-modal-sheet my-auto max-w-xl">
            <div className="app-modal-header">
              <div>
                <h2 id="application-form-title" className="text-xl font-semibold">
                  {editingId !== null ? "Edit application" : "Track application"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId !== null ? "Update this application’s details." : "Record an application for one of your saved jobs."}
                </p>
              </div>
              <button type="button" aria-label="Close" title="Close" onClick={closeForm} disabled={saving} className="app-icon-button app-icon-button-ghost">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form ref={formRef} noValidate onSubmit={handleSaveApplication} className="space-y-5 p-6">
              <FormField id="application-job" label="Job" required error={errors.jobId}>
                <select
                  {...fieldProps("application-job", errors.jobId)}
                  data-autofocus
                  disabled={editingId !== null}
                  value={form.jobId}
                  onChange={(event) => setForm({ ...form, jobId: event.target.value })}
                  className="form-input"
                >
                  <option value="">{jobs.length === 0 ? "No saved jobs yet" : "Choose a saved job"}</option>
                  {jobs.map((job) => <option key={job.id} value={job.id}>{job.position} at {job.company}</option>)}
                </select>
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField id="application-status" label="Status">
                  <select
                    id="application-status"
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as ApplicationStatus })}
                    className="form-input"
                  >
                    {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </FormField>
                <FormField id="application-date" label="Date applied" required={form.status !== "Saved"} error={errors.dateApplied}>
                  <input
                    {...fieldProps("application-date", errors.dateApplied)}
                    type="date"
                    value={form.dateApplied}
                    onChange={(event) => setForm({ ...form, dateApplied: event.target.value })}
                    className="form-input"
                  />
                </FormField>
              </div>

              <FormField id="application-resume" label="Resume used">
                <select id="application-resume" value={form.resumeId} onChange={(event) => setForm({ ...form, resumeId: event.target.value })} className="form-input">
                  <option value="">None</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>{resume.name}{resume.isDefault ? " (default)" : ""}</option>
                  ))}
                </select>
              </FormField>

              {selectedJob?.latestAnalysisIsStale && (
                <OutdatedAnalysisWarning
                  reasons={selectedJob.latestAnalysisStaleReasons}
                  message="The resume match for this job is out of date. You can still save the application."
                />
              )}

              <FormField id="application-notes" label="Notes">
                <textarea
                  id="application-notes"
                  rows={4}
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Recruiter contact, follow-up dates, anything worth remembering"
                  className="form-input resize-y"
                />
              </FormField>

              {requestError && <p role="alert" className="app-notice-error">{requestError}</p>}

              <div className="app-modal-footer">
                <button type="button" onClick={closeForm} disabled={saving} className="app-button-secondary">Cancel</button>
                <button type="submit" disabled={saving} aria-busy={saving} className="app-button-primary">
                  {saving && <span className="app-spinner !border-white/30 !border-t-white" aria-hidden="true" />}
                  {editingId !== null ? "Save changes" : "Track application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {applicationToDelete && (
        <div className="app-modal-backdrop !z-[80]">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-application-title" aria-describedby="delete-application-description" className="app-modal-panel max-w-md p-6">
            <h2 id="delete-application-title" className="text-lg font-semibold text-slate-900">Delete this application?</h2>
            <div id="delete-application-description" className="mt-2 space-y-2 text-[0.9375rem] leading-6 text-slate-600">
              <p>Your application for {applicationToDelete.position} at {applicationToDelete.company} will be permanently deleted. The saved job stays.</p>
              {deleteInterviewCount > 0 && (
                <p className="font-medium text-red-700">
                  {deleteInterviewCount} interview{deleteInterviewCount === 1 ? "" : "s"} for this application will also be deleted.
                </p>
              )}
              <p>This can’t be undone.</p>
            </div>
            {deleteError && <p role="alert" className="app-notice-error mt-4">{deleteError}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" data-autofocus onClick={() => setApplicationToDelete(null)} className="app-button-secondary">Cancel</button>
              <button type="button" onClick={confirmDeleteApplication} className="app-button-danger">Delete application</button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
