"use client";

import { useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
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
import { CareerTrack, StatusChip } from "@/components/CareerTrack";
import useDialogControls from "@/hooks/useDialogControls";
import { APPLICATION_STATUSES, isActiveStatus } from "@/lib/applicationStatus";

type ApplicationForm = {
  jobId: string;
  dateApplied: string;
  status: ApplicationStatus;
  notes: string;
  resumeId: string;
};

const ALL = "All statuses";

const emptyForm: ApplicationForm = {
  jobId: "",
  dateApplied: "",
  status: "Applied",
  notes: "",
  resumeId: "",
};

function getLocalDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [rowError, setRowError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const urlHandled = useRef(false);

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
    if (status && (APPLICATION_STATUSES as readonly string[]).includes(status)) {
      setStatusFilter(status);
    }
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
      setError("");
      setShowForm(true);
    }
    if (params.size > 0) window.history.replaceState(null, "", "/applications");
  }, [jobs, jobsLoading, resumes, resumesLoading]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredApplications = applications
    .filter((application) => {
      const matchesSearch = `${application.company} ${application.position} ${application.location}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === ALL || application.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied) || b.id.localeCompare(a.id));

  const filtersActive = search !== "" || statusFilter !== ALL;
  const activeCount = applications.filter((application) => isActiveStatus(application.status)).length;

  function clearFilters() {
    setSearch("");
    setStatusFilter(ALL);
  }

  function openAddApplication() {
    const trackedJobs = new Set(applications.map((application) => application.jobId));
    setEditingId(null);
    setForm({
      ...emptyForm,
      jobId: jobs.find((job) => !trackedJobs.has(job.id))?.id ?? jobs[0]?.id ?? "",
      dateApplied: getLocalDate(),
      resumeId: resumes.find((resume) => resume.isDefault)?.id ?? "",
    });
    setError("");
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
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSaveApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.jobId) {
      setError("Choose the job you applied for.");
      return;
    }

    if (!form.dateApplied && form.status !== "Saved") {
      setError("Enter the date you applied, or set the status to Saved.");
      return;
    }

    const applicationData: ApplicationForm = { ...form, notes: form.notes.trim() };

    setSaving(true);
    try {
      if (editingId !== null) {
        await updateApplication(editingId, applicationData);
        setNotice("Application updated.");
      } else {
        await createApplication(applicationData);
        setNotice("Application tracked.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The application could not be saved. Try again.");
      return;
    } finally {
      setSaving(false);
    }

    clearFilters();
    closeForm();
  }

  async function changeStatus(application: Application, status: ApplicationStatus) {
    setRowError("");
    setUpdatingId(application.id);
    try {
      await updateApplication(application.id, {
        jobId: application.jobId,
        dateApplied: application.dateApplied || (status === "Saved" ? "" : getLocalDate()),
        status,
        notes: application.notes,
        resumeId: application.resumeId,
      });
      setNotice(`${application.position} moved to ${status}.`);
    } catch (requestError) {
      setRowError(requestError instanceof Error ? requestError.message : "The status could not be changed. Try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmDeleteApplication() {
    if (!applicationToDelete) return;
    setDeleteError("");
    try {
      await deleteApplication(applicationToDelete.id);
      setNotice(`Deleted the application for ${applicationToDelete.position}.`);
      setApplicationToDelete(null);
    } catch (requestError) {
      setDeleteError(requestError instanceof Error ? requestError.message : "The application could not be deleted. Try again.");
    }
  }

  const selectedJob = jobs.find((job) => job.id === form.jobId);
  const deleteInterviewCount = applicationToDelete
    ? interviews.filter((interview) => interview.applicationId === applicationToDelete.id).length
    : 0;

  return (
    <WorkspaceLayout>
      <div className="app-page space-y-6">
        <PageHeader
          title="Applications"
          description={
            applications.length > 0
              ? `${activeCount} active of ${applications.length}. Update the status as each stage happens.`
              : "Jobs you’ve applied for, and where each one stands."
          }
          action={
            <button type="button" onClick={openAddApplication} disabled={jobs.length === 0} className="app-button-primary">
              <Plus size={18} aria-hidden="true" />
              Track application
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
        {applicationsError && <p role="alert" className="app-notice-error">{applicationsError}</p>}
        {rowError && <p role="alert" className="app-notice-error">{rowError}</p>}

        {applicationsLoading && applications.length === 0 && (
          <div role="status" className="app-loading-state">
            <span className="app-spinner" aria-hidden="true" />Loading your applications…
          </div>
        )}

        {!applicationsLoading && applications.length === 0 && !applicationsError && (
          <div className="app-empty-state">
            <h2 className="app-section-title">No applications yet</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-slate-500">
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
          <>
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
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Status"
                className="form-input sm:w-48"
              >
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

            {filteredApplications.length === 0 ? (
              <div className="app-empty-state">
                <p className="font-medium text-slate-800">No applications match these filters</p>
                <button type="button" onClick={clearFilters} className="app-button-secondary app-button-compact mt-4">Clear filters</button>
              </div>
            ) : (
              <ul className="app-surface divide-y divide-slate-200">
                {filteredApplications.map((application) => (
                  <li key={application.id}>
                    <article
                      aria-labelledby={`application-${application.id}-title`}
                      className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6 xl:grid-cols-[minmax(0,1fr)_13rem_auto] xl:items-start"
                    >
                      <div className="min-w-0">
                        <h2 id={`application-${application.id}-title`} className="text-[1.0625rem] font-semibold text-slate-900">
                          {application.position}
                        </h2>
                        <p className="text-[0.9375rem] text-slate-700">{application.company}</p>
                        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                          <div className="flex gap-1">
                            <dt>Applied</dt>
                            <dd className="tabular-nums">{application.dateApplied ? formatDate(application.dateApplied) : "not yet"}</dd>
                          </div>
                          <div className="flex gap-1"><dt>Resume</dt><dd>{application.resumeId ? application.resumeName : "none"}</dd></div>
                          <div className="flex gap-1"><dt className="sr-only">Location</dt><dd>{application.location}</dd></div>
                        </dl>
                        {application.notes && (
                          <div className="mt-3 max-w-[72ch] text-sm text-slate-600">
                            <ExpandableText text={application.notes} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 sm:col-start-1 sm:row-start-2 xl:col-start-auto xl:row-start-auto">
                        <StatusChip status={application.status} />
                        <CareerTrack status={application.status} className="w-full max-w-52" />
                      </div>

                      <div className="flex items-center gap-2 sm:col-start-2 sm:row-start-1 sm:self-start xl:col-start-auto xl:row-start-auto">
                        <label className="sr-only" htmlFor={`status-${application.id}`}>
                          Status for {application.position} at {application.company}
                        </label>
                        <select
                          id={`status-${application.id}`}
                          value={application.status}
                          disabled={updatingId === application.id}
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
                ))}
              </ul>
            )}
          </>
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
              <button type="button" aria-label="Close" onClick={closeForm} disabled={saving} className="app-icon-button app-icon-button-ghost">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form noValidate onSubmit={handleSaveApplication} className="space-y-5 p-6">
              <FormField label="Job" required>
                <select
                  required
                  data-autofocus
                  disabled={editingId !== null}
                  value={form.jobId}
                  onChange={(event) => setForm({ ...form, jobId: event.target.value })}
                  aria-invalid={error !== "" && !form.jobId}
                  className="form-input"
                >
                  <option value="">{jobs.length === 0 ? "No saved jobs yet" : "Choose a saved job"}</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.position} at {job.company}</option>
                  ))}
                </select>
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Status">
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as ApplicationStatus })}
                    className="form-input"
                  >
                    {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </FormField>
                <FormField label="Date applied" required={form.status !== "Saved"}>
                  <input
                    type="date"
                    value={form.dateApplied}
                    onChange={(event) => setForm({ ...form, dateApplied: event.target.value })}
                    aria-invalid={error !== "" && !form.dateApplied && form.status !== "Saved"}
                    className="form-input"
                  />
                </FormField>
              </div>

              <FormField label="Resume used">
                <select
                  value={form.resumeId}
                  onChange={(event) => setForm({ ...form, resumeId: event.target.value })}
                  className="form-input"
                >
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

              <FormField label="Notes">
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Recruiter contact, follow-up dates, anything worth remembering"
                  className="form-input resize-y"
                />
              </FormField>

              {error && <p role="alert" className="app-notice-error">{error}</p>}

              <div className="app-modal-footer">
                <button type="button" onClick={closeForm} disabled={saving} className="app-button-secondary">Cancel</button>
                <button type="submit" disabled={saving || jobs.length === 0} aria-busy={saving} className="app-button-primary">
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
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-application-title"
            aria-describedby="delete-application-description"
            className="app-modal-panel max-w-md p-6"
          >
            <h2 id="delete-application-title" className="text-lg font-semibold text-slate-900">Delete this application?</h2>
            <div id="delete-application-description" className="mt-2 space-y-2 text-[0.9375rem] leading-6 text-slate-600">
              <p>
                Your application for {applicationToDelete.position} at {applicationToDelete.company} will be permanently deleted. The saved job stays.
              </p>
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

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
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
