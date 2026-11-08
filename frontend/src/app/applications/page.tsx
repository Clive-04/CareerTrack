"use client";

import { useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import {
  Search,
  Plus,
  FileText,
  Building2,
  MapPin,
  CalendarDays,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useApplications,
  type Application,
  type ApplicationStatus,
} from "@/components/ApplicationsProvider";
import { useJobs } from "@/components/JobsProvider";
import { useResumes } from "@/components/ResumesProvider";
import OutdatedAnalysisWarning from "@/components/OutdatedAnalysisWarning";
import ExpandableText from "@/components/ExpandableText";
import MetricCard from "@/components/MetricCard";
import useDialogControls from "@/hooks/useDialogControls";

type ApplicationForm = {
  jobId: string;
  dateApplied: string;
  status: ApplicationStatus;
  notes: string;
  resumeId: string;
};

const statuses: ApplicationStatus[] = [
  "Applied",
  "In Review",
  "Interview",
  "Offer",
  "Rejected",
];

const statusStyles: Record<ApplicationStatus, string> = {
  Applied: "bg-blue-50 text-blue-700",
  "In Review": "bg-amber-50 text-amber-700",
  Interview: "bg-purple-50 text-purple-700",
  Offer: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
};

const emptyForm: ApplicationForm = {
  jobId: "",
  dateApplied: "",
  status: "Applied",
  notes: "",
  resumeId: "",
};

function getLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [applicationToDelete, setApplicationToDelete] =
    useState<Application | null>(null);
  const prefillHandled = useRef(false);

  useDialogControls(showForm, closeForm);
  useDialogControls(applicationToDelete !== null, () => setApplicationToDelete(null));

  /* The URL-driven modal must be ready before the destination page is painted. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (prefillHandled.current || jobsLoading || resumesLoading) return;

    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("job") ?? "";
    const resumeId = params.get("resume") ?? "";
    if (!jobs.some((job) => job.id === jobId)) return;

    prefillHandled.current = true;
    setEditingId(null);
    setForm({
      ...emptyForm,
      jobId,
      resumeId: resumes.some((resume) => resume.id === resumeId) ? resumeId : "",
      dateApplied: getLocalDate(),
    });
    setError("");
    setShowForm(true);
    window.history.replaceState(null, "", "/applications");
  }, [jobs, jobsLoading, resumes, resumesLoading]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      `${application.company} ${application.position} ${application.location}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All statuses" ||
      application.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function openAddApplication() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      jobId: jobs[0]?.id ?? "",
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
      setError("Select a saved job first.");
      return;
    }

    if (!form.dateApplied) {
      setError("Date applied is required.");
      return;
    }

    const applicationData: ApplicationForm = {
      jobId: form.jobId,
      dateApplied: form.dateApplied,
      status: form.status,
      notes: form.notes.trim(),
      resumeId: form.resumeId,
    };

    try {
      if (editingId !== null) {
        await updateApplication(editingId, applicationData);
      } else {
        await createApplication(applicationData);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this application.",
      );
      return;
    }

    setSearch("");
    setStatusFilter("All statuses");
    closeForm();
  }

  function handleDeleteApplication(id: string) {
    const application = applications.find((item) => item.id === id);

    if (!application) return;

    setApplicationToDelete(application);
  }

  async function confirmDeleteApplication() {
    if (!applicationToDelete) return;

    try {
      await deleteApplication(applicationToDelete.id);
      setApplicationToDelete(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this application.",
      );
    }
  }

  const offerCount = applications.filter(
    (application) => application.status === "Offer",
  ).length;

  const interviewCount = applications.filter(
    (application) => application.status === "Interview",
  ).length;

  const activeCount = applications.filter(
    (application) =>
      application.status !== "Rejected" &&
      application.status !== "Offer",
  ).length;
  const selectedJob = jobs.find((job) => job.id === form.jobId);

  return (
    <WorkspaceLayout>
      <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
        <PageHeader
          eyebrow="Your job search"
          title="Applications"
          description="Track your progress from application to offer."
          action={
            <button
              type="button"
              onClick={openAddApplication}
              className="app-button-primary self-start"
            >
              <Plus size={18} />
              Add Application
            </button>
          }
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Applications"
            value={applications.length}
            icon={FileText}
            tone="indigo"
          />

          <MetricCard
            label="Active Applications"
            value={activeCount}
            icon={Building2}
            tone="blue"
          />

          <MetricCard
            label="Interviews"
            value={interviewCount}
            icon={CalendarDays}
            tone="violet"
          />

          <MetricCard
            label="Offers Received"
            value={offerCount}
            icon={FileText}
            tone="emerald"
          />
        </section>

        {(applicationsLoading || jobsLoading) && (
          <div role="status" className="app-loading-state"><span className="app-spinner" aria-hidden="true" />Loading your applications...</div>
        )}

        {applicationsError && (
          <p role="alert" className="app-notice-error">
            {applicationsError}
          </p>
        )}

        <section className="app-surface p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="app-search-control flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-3">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search company, role, or location..."
                aria-label="Search applications"
                className="w-full min-w-0 bg-transparent text-sm outline-none"
              />
            </label>

            <select
              aria-label="Filter by application status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500"
            >
              <option value="All statuses">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="app-filter-summary">
            <p>
              Showing <span className="font-semibold text-slate-700">{filteredApplications.length}</span>{" "}
              of {applications.length} applications
            </p>
            {(search || statusFilter !== "All statuses") && (
              <button
                type="button"
                onClick={() => { setSearch(""); setStatusFilter("All statuses"); }}
                className="app-button-text"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        <section className="app-surface overflow-hidden">
          <div className="border-b border-slate-100 p-5 sm:px-6">
            <h2 className="text-lg font-bold text-slate-900">
              Application History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
                Manage each application and its current status in one place.
            </p>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {filteredApplications.map((application) => (
              <article key={application.id} className="app-data-card">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-900">{application.company}</h3>
                    <p className="mt-1 text-sm text-slate-600">{application.position}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <MapPin size={13} /> {application.location}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[application.status]}`}>
                    {application.status}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
                  <div>
                    <dt className="text-slate-400">Date applied</dt>
                    <dd className="mt-1 font-semibold text-slate-700">
                      {new Date(`${application.dateApplied}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Resume</dt>
                    <dd className="mt-1 truncate font-semibold text-slate-700">{application.resumeName}</dd>
                  </div>
                </dl>

                {application.notes && (
                  <ExpandableText text={application.notes} className="mt-3 text-sm leading-6 text-slate-500" />
                )}

                <div className="app-card-actions">
                  <button type="button" onClick={() => openEditApplication(application)} className="app-button-secondary flex-1">
                    <Pencil size={15} /> Edit
                  </button>
                  <button type="button" onClick={() => handleDeleteApplication(application.id)} className="app-button-danger-outline flex-1">
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </article>
            ))}

            {filteredApplications.length === 0 && (
              <div className="app-empty-state">
                <FileText size={32} className="mx-auto text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-800">No applications found</h3>
                <p className="mt-2 text-sm text-slate-500">Adjust your search or filters to see other applications.</p>
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Company / Position
                  </th>
                  <th scope="col" className="px-6 py-4 text-center font-semibold">
                    Date Applied
                  </th>
                  <th scope="col" className="px-6 py-4 text-center font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-center font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <Building2 size={20} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {application.company}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {application.position}
                          </p>
                          <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                            <MapPin size={13} />
                            {application.location}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            Resume: {application.resumeName}
                          </p>

                          {application.notes && (
                            <ExpandableText text={application.notes} className="mt-2 max-w-xs text-xs leading-5 text-slate-500" />
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-center text-sm text-slate-500">
                      {new Date(
                        `${application.dateApplied}T12:00:00`,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[application.status]}`}
                      >
                        {application.status}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEditApplication(application)}
                          aria-label={`Edit application for ${application.position} at ${application.company}`}
                          className="app-button-secondary app-button-compact w-24"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteApplication(application.id)
                          }
                          aria-label={`Delete application for ${application.position} at ${application.company}`}
                          className="app-button-danger-outline app-button-compact w-24"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredApplications.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-14 text-center text-sm text-slate-500"
                    >
                      No applications found. Try another search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showForm && (
        <div className="app-modal-backdrop app-modal-backdrop-scroll">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-form-title"
            className="app-modal-panel my-auto max-w-xl"
          >
            <div className={`flex items-start justify-between gap-4 border-b px-6 py-5 ${editingId !== null ? "border-amber-200 bg-amber-50/70" : "border-indigo-200 bg-indigo-50/70"}`}>
              <div>
                <h2
                  id="application-form-title"
                  className={`text-xl font-bold ${editingId !== null ? "text-amber-950" : "text-indigo-950"}`}
                >
                  {editingId !== null
                    ? "Edit Application"
                    : "Add Application"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId !== null
                    ? "Update the details of your application."
                    : "Record a job you have applied for."}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close form"
                onClick={closeForm}
                className="app-icon-button app-icon-button-ghost shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <form
              noValidate
              onSubmit={handleSaveApplication}
              className="space-y-4 p-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Saved Job *">
                  <select
                    required
                    disabled={editingId !== null}
                    value={form.jobId}
                    onChange={(event) =>
                      setForm({ ...form, jobId: event.target.value })
                    }
                    className="form-input"
                  >
                    <option value="">
                      {jobs.length === 0
                        ? "No saved jobs available"
                        : "Select a saved job"}
                    </option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.company} — {job.position}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Date Applied *">
                  <input
                    type="date"
                    required
                    value={form.dateApplied}
                    onChange={(event) =>
                      setForm({ ...form, dateApplied: event.target.value })
                    }
                    className="form-input"
                  />
                </FormField>

                <FormField label="Application Status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as ApplicationStatus,
                      })
                    }
                    className="form-input"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Resume used (optional)">
                  <select
                    value={form.resumeId}
                    onChange={(event) =>
                      setForm({ ...form, resumeId: event.target.value })
                    }
                    className="form-input"
                  >
                    <option value="">No resume selected</option>
                    {resumes.map((resume) => (
                      <option key={resume.id} value={resume.id}>
                        {resume.name}{resume.isDefault ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {selectedJob?.latestAnalysisIsStale && (
                <OutdatedAnalysisWarning
                  reasons={selectedJob.latestAnalysisStaleReasons}
                  message="For the most accurate comparison, analyze the current job and resume again. You can still save this application if you have reviewed them yourself."
                />
              )}

              <FormField label="Notes (optional)">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Recruiter details, follow-up reminders, or other notes..."
                  className="form-input resize-y"
                />
              </FormField>

              {error && (
                <p role="alert" className="text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              {jobs.length === 0 && (
                <p className="text-sm text-slate-500">
                  Add a job before creating an application.
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="app-button-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="app-button-primary"
                >
                  {editingId !== null
                    ? "Save Changes"
                    : "Save Application"}
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
            aria-labelledby="delete-application-dialog-title"
            aria-describedby="delete-application-dialog-description"
            className="app-modal-panel max-w-sm p-6 text-center"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={21} />
            </div>

            <h2
              id="delete-application-dialog-title"
              className="mx-auto mt-5 w-fit rounded-lg bg-red-50 px-3 py-2 text-lg font-bold text-red-800"
            >
              Delete this application?
            </h2>
            <p id="delete-application-dialog-description" className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete your application for{" "}
              {applicationToDelete.position} at {applicationToDelete.company}?
            </p>

            <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setApplicationToDelete(null)}
                className="app-button-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteApplication}
                className="app-button-danger"
              >
                Delete application
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .form-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.7rem 0.85rem;
          font-size: 0.875rem;
          outline: none;
          background-color: white;
        }

        .form-input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgb(79 70 229 / 12%);
        }
      `}</style>
    </WorkspaceLayout>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
