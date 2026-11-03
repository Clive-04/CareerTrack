"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
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

  useEffect(() => {
    if (prefillHandled.current || jobsLoading || resumesLoading) return;
    prefillHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("job") ?? "";
    const resumeId = params.get("resume") ?? "";
    if (!jobs.some((job) => job.id === jobId)) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
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
    });
    return () => { active = false; };
  }, [jobs, jobsLoading, resumes, resumesLoading]);

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
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Application
            </button>
          }
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Applications"
            value={applications.length}
            icon={<FileText size={21} />}
          />

          <SummaryCard
            title="Active Applications"
            value={activeCount}
            icon={<Building2 size={21} />}
          />

          <SummaryCard
            title="Interviews"
            value={interviewCount}
            icon={<CalendarDays size={21} />}
          />

          <SummaryCard
            title="Offers Received"
            value={offerCount}
            icon={<FileText size={21} />}
          />
        </section>

        {(applicationsLoading || jobsLoading) && (
          <p className="text-sm text-slate-500">
            Loading your applications...
          </p>
        )}

        {applicationsError && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {applicationsError}
          </p>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-3">
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
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="All statuses">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredApplications.length}
            </span>{" "}
            of {applications.length} applications
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5 sm:px-6">
            <h2 className="text-lg font-bold text-slate-900">
              Application History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
                Manage each application and its current status in one place.
            </p>
          </div>

          <div className="overflow-x-auto">
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
                            <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                              {application.notes}
                            </p>
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
                          className="inline-flex w-24 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
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
                          className="inline-flex w-24 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-form-title"
            className="my-4 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="application-form-title"
                  className="text-xl font-bold text-slate-900"
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
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              noValidate
              onSubmit={handleSaveApplication}
              className="mt-6 space-y-4"
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
                <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">The AI analysis for this job is outdated.</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {selectedJob.latestAnalysisStaleReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  <p className="mt-2">For the most accurate comparison, analyze the current job and resume again. You can still save this application if you have reviewed them yourself.</p>
                </div>
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
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-application-dialog-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={21} />
            </div>

            <h2
              id="delete-application-dialog-title"
              className="mt-5 text-lg font-bold text-slate-900"
            >
              Delete this application?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete your application for{" "}
              {applicationToDelete.position} at {applicationToDelete.company}?
            </p>

            <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setApplicationToDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteApplication}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
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
          background: white;
        }

        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgb(59 130 246 / 12%);
        }
      `}</style>
    </WorkspaceLayout>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>

      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">{icon}</div>
    </div>
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
