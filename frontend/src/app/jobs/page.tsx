"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import JobDescription from "@/components/JobDescription";
import DescriptionFormattingToolbar from "@/components/DescriptionFormattingToolbar";
import { useJobs, type Job } from "@/components/JobsProvider";
import { useApplications } from "@/components/ApplicationsProvider";
import { useInterviews } from "@/components/InterviewsProvider";
import ResumeAnalysisDialog from "@/components/ResumeAnalysisDialog";
import ActionMenu from "@/components/ActionMenu";
import { StatusChip } from "@/components/CareerTrack";
import { countWords, MIN_JOB_WORDS, MAX_JOB_CHARACTERS } from "@/lib/jobDescription";
import useDialogControls from "@/hooks/useDialogControls";
import { History, Pencil, Plus, Search, Sparkles, Trash2, X } from "lucide-react";

const employmentTypes = ["All types", "Full-time", "Part-time", "Contract", "Internship"];

const emptyForm = {
  company: "",
  position: "",
  location: "",
  employmentType: "Full-time",
  salary: "",
  description: "",
};

export default function JobsPage() {
  const {
    jobs,
    createJob,
    updateJob,
    deleteJob,
    refreshJobs,
    isLoading: jobsLoading,
    error: jobsError,
  } = useJobs();
  const { applications } = useApplications();
  const { interviews } = useInterviews();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [locationFilter, setLocationFilter] = useState("All locations");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [analysisJob, setAnalysisJob] = useState<Job | null>(null);
  const [analysisView, setAnalysisView] = useState<"new" | "history">("new");
  const shortcutHandled = useRef(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useDialogControls(showForm && !saving, closeForm);
  useDialogControls(jobToDelete !== null, () => setJobToDelete(null));

  // Deep links: /jobs?new=1 opens the form; /jobs?analysis=<id>[&view=history] opens analysis.
  useEffect(() => {
    if (shortcutHandled.current || jobsLoading) return;
    shortcutHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    let active = true;

    if (params.get("new") === "1") {
      queueMicrotask(() => {
        if (!active) return;
        openAddJob();
        window.history.replaceState(null, "", "/jobs");
      });
      return () => { active = false; };
    }

    const job = jobs.find((item) => item.id === params.get("analysis"));
    if (!job) return;
    const requestedView = params.get("view") === "history" ? "history" : "new";
    queueMicrotask(() => {
      if (!active) return;
      setAnalysisView(requestedView);
      setAnalysisJob(job);
      window.history.replaceState(null, "", "/jobs");
    });
    return () => { active = false; };
  }, [jobs, jobsLoading]);

  const locations = useMemo(
    () => ["All locations", ...new Set(jobs.map((job) => job.location))],
    [jobs],
  );

  const applicationByJob = useMemo(
    () => new Map(applications.map((application) => [application.jobId, application])),
    [applications],
  );

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = `${job.company} ${job.position} ${job.location}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = typeFilter === "All types" || job.employmentType === typeFilter;
    const matchesLocation = locationFilter === "All locations" || job.location === locationFilter;
    return matchesSearch && matchesType && matchesLocation;
  });

  const filtersActive = search !== "" || typeFilter !== "All types" || locationFilter !== "All locations";

  function clearFilters() {
    setSearch("");
    setTypeFilter("All types");
    setLocationFilter("All locations");
  }

  function openAddJob() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEditJob(job: Job) {
    setEditingId(job.id);
    setForm({
      company: job.company,
      position: job.position,
      location: job.location,
      employmentType: job.employmentType,
      salary: job.salary,
      description: job.description,
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

  async function handleSaveJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.company.trim() || !form.position.trim()) {
      setError("Enter a company and a position.");
      return;
    }

    if (countWords(form.description) < MIN_JOB_WORDS || form.description.length > MAX_JOB_CHARACTERS) {
      setError(`The description needs at least ${MIN_JOB_WORDS} words and at most 20,000 characters. Paste the original posting where possible.`);
      return;
    }

    const jobData = {
      company: form.company.trim(),
      position: form.position.trim(),
      location: form.location.trim() || "Not specified",
      employmentType: form.employmentType,
      salary: form.salary.trim() || "Not specified",
      description: form.description.trim(),
    };

    setSaving(true);
    try {
      if (editingId !== null) {
        await updateJob(editingId, jobData);
        setNotice(`Saved changes to ${jobData.position}.`);
      } else {
        await createJob(jobData);
        setNotice(`Added ${jobData.position} at ${jobData.company}.`);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The job could not be saved. Try again.");
      return;
    } finally {
      setSaving(false);
    }

    clearFilters();
    closeForm();
  }

  async function confirmDeleteJob() {
    if (!jobToDelete) return;
    setDeleteError("");
    try {
      await deleteJob(jobToDelete.id);
      setNotice(`Deleted ${jobToDelete.position}.`);
      setLocationFilter("All locations");
      setJobToDelete(null);
    } catch (requestError) {
      setDeleteError(requestError instanceof Error ? requestError.message : "The job could not be deleted. Try again.");
    }
  }

  const deleteApplication = jobToDelete ? applicationByJob.get(jobToDelete.id) : undefined;
  const deleteInterviewCount = deleteApplication
    ? interviews.filter((interview) => interview.applicationId === deleteApplication.id).length
    : 0;
  const wordCount = countWords(form.description);

  return (
    <WorkspaceLayout>
      <div className="app-page space-y-6">
        <PageHeader
          title="Jobs"
          description="Roles you’re considering. Analyze your resume against one, then track it once you apply."
          action={
            <button type="button" onClick={openAddJob} className="app-button-primary">
              <Plus size={18} aria-hidden="true" />
              Add job
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
        {jobsError && <p role="alert" className="app-notice-error">{jobsError}</p>}

        {jobs.length > 0 && (
          <section aria-label="Filter jobs" className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="app-search-control flex flex-1 items-center gap-2 border px-3">
              <Search size={17} className="text-slate-500" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search company, role, or location"
                aria-label="Search jobs"
                className="h-11 w-full min-w-0 bg-transparent text-[0.9375rem] outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-3 md:flex">
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                aria-label="Employment type"
                className="form-input md:w-40"
              >
                {employmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <select
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
                aria-label="Location"
                className="form-input md:w-48"
              >
                {locations.map((location) => <option key={location} value={location}>{location}</option>)}
              </select>
            </div>
          </section>
        )}

        {jobsLoading && jobs.length === 0 && (
          <div role="status" className="app-loading-state">
            <span className="app-spinner" aria-hidden="true" />Loading your jobs…
          </div>
        )}

        {!jobsLoading && jobs.length === 0 && !jobsError && (
          <div className="app-empty-state">
            <h2 className="app-section-title">No jobs yet</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-slate-500">
              Add a role you’re interested in. Include the full description so the resume analysis has something to compare against.
            </p>
            <button type="button" onClick={openAddJob} className="app-button-secondary mt-5">
              <Plus size={17} aria-hidden="true" />Add your first job
            </button>
          </div>
        )}

        {jobs.length > 0 && (
          <>
            <div className="app-filter-summary !mt-0">
              <p aria-live="polite">
                Showing <span className="font-semibold text-slate-800">{filteredJobs.length}</span> of {jobs.length} jobs
              </p>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="app-button-text">Clear filters</button>
              )}
            </div>

            {filteredJobs.length === 0 ? (
              <div className="app-empty-state">
                <p className="font-medium text-slate-800">No jobs match these filters</p>
                <button type="button" onClick={clearFilters} className="app-button-secondary app-button-compact mt-4">Clear filters</button>
              </div>
            ) : (
              <ul className="app-surface divide-y divide-slate-200">
                {filteredJobs.map((job) => {
                  const application = applicationByJob.get(job.id);
                  return (
                    <li key={job.id}>
                      <article aria-labelledby={`job-${job.id}-title`} className="p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h2 id={`job-${job.id}-title`} className="text-[1.1875rem] font-semibold leading-snug text-slate-900">
                              {job.position}
                            </h2>
                            <p className="mt-0.5 text-[0.9375rem] text-slate-700">{job.company}</p>
                            <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                              <div className="flex gap-1"><dt className="sr-only">Location</dt><dd>{job.location}</dd></div>
                              <div className="flex gap-1"><dt className="sr-only">Type</dt><dd>{job.employmentType}</dd></div>
                              {job.salary !== "Not specified" && (
                                <div className="flex gap-1"><dt className="sr-only">Salary</dt><dd className="tabular-nums">{job.salary}</dd></div>
                              )}
                              <div className="flex gap-1"><dt>Added</dt><dd>{job.dateAdded}</dd></div>
                            </dl>
                          </div>

                          <div className="flex shrink-0 items-start gap-2">
                            {application && <StatusChip status={application.status} />}
                            <ActionMenu
                              label={`More actions for ${job.position} at ${job.company}`}
                              items={[
                                {
                                  label: "Analysis history",
                                  icon: History,
                                  onSelect: () => { setAnalysisView("history"); setAnalysisJob(job); },
                                },
                                { label: "Edit job", icon: Pencil, onSelect: () => openEditJob(job) },
                                "separator",
                                {
                                  label: "Delete job",
                                  icon: Trash2,
                                  tone: "danger",
                                  onSelect: () => { setDeleteError(""); setJobToDelete(job); },
                                },
                              ]}
                            />
                          </div>
                        </div>

                        <div className="mt-4 max-w-[72ch]">
                          <JobDescription description={job.description} />
                        </div>

                        {job.latestAnalysisIsStale && (
                          <div role="status" className="app-notice-warning mt-4 flex-col !gap-1">
                            <p className="font-semibold">Resume match is out of date (was {job.latestAnalysisScore}/100)</p>
                            <ul className="list-disc pl-5">
                              {job.latestAnalysisStaleReasons.map((reason) => <li key={reason}>{reason}</li>)}
                            </ul>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setAnalysisView("new"); setAnalysisJob(job); }}
                            className="app-button-secondary app-button-compact"
                          >
                            <Sparkles size={16} aria-hidden="true" />
                            {job.latestAnalysisIsStale ? "Re-run analysis" : job.latestAnalysisScore !== null ? "Analyze again" : "Analyze resume"}
                          </button>
                          {application ? (
                            <Link href={`/applications?q=${encodeURIComponent(job.position)}`} className="app-button-ghost app-button-compact">
                              View application
                            </Link>
                          ) : (
                            <Link href={`/applications?job=${job.id}`} className="app-button-ghost app-button-compact">
                              Track application
                            </Link>
                          )}
                          {job.latestAnalysisScore !== null && !job.latestAnalysisIsStale && (
                            <span className="ml-auto text-sm text-slate-600">
                              Resume match <span className="font-semibold tabular-nums text-slate-900">{job.latestAnalysisScore}/100</span>
                            </span>
                          )}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      {showForm && (
        <div className="app-modal-backdrop app-modal-backdrop-scroll">
          <div role="dialog" aria-modal="true" aria-labelledby="job-form-title" className="app-modal-panel app-modal-sheet my-auto max-w-xl">
            <div className="app-modal-header">
              <div>
                <h2 id="job-form-title" className="text-xl font-semibold">
                  {editingId !== null ? "Edit job" : "Add job"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId !== null ? "Update the details of this role." : "Record a role you want to pursue."}
                </p>
              </div>
              <button type="button" aria-label="Close" onClick={closeForm} disabled={saving} className="app-icon-button app-icon-button-ghost">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form noValidate onSubmit={handleSaveJob} className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Company" required>
                  <input
                    required
                    data-autofocus
                    value={form.company}
                    onChange={(event) => setForm({ ...form, company: event.target.value })}
                    aria-invalid={error !== "" && !form.company.trim()}
                    autoComplete="organization"
                    className="form-input"
                  />
                </FormField>
                <FormField label="Position" required>
                  <input
                    required
                    value={form.position}
                    onChange={(event) => setForm({ ...form, position: event.target.value })}
                    aria-invalid={error !== "" && !form.position.trim()}
                    autoComplete="organization-title"
                    className="form-input"
                  />
                </FormField>
                <FormField label="Location">
                  <input
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                    placeholder="City, or Remote"
                    className="form-input"
                  />
                </FormField>
                <FormField label="Employment type">
                  <select
                    value={form.employmentType}
                    onChange={(event) => setForm({ ...form, employmentType: event.target.value })}
                    className="form-input"
                  >
                    {employmentTypes.slice(1).map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="Salary">
                <input
                  value={form.salary}
                  onChange={(event) => setForm({ ...form, salary: event.target.value })}
                  placeholder="₱30,000–₱40,000 / month"
                  className="form-input"
                />
              </FormField>

              <div>
                <label htmlFor="job-description" className="app-field-label">
                  Job description<span className="font-normal text-slate-500"> (required)</span>
                </label>
                <DescriptionFormattingToolbar
                  textareaRef={descriptionRef}
                  value={form.description}
                  maxLength={MAX_JOB_CHARACTERS}
                  onChange={(description) => setForm({ ...form, description })}
                />
                <textarea
                  id="job-description"
                  ref={descriptionRef}
                  required
                  rows={9}
                  maxLength={MAX_JOB_CHARACTERS}
                  aria-describedby="job-description-help"
                  aria-invalid={error !== "" && wordCount < MIN_JOB_WORDS}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Paste the original posting: responsibilities, required skills, experience, and qualifications."
                  className="form-input resize-y !rounded-t-none"
                />
                <p id="job-description-help" className={`app-field-hint ${wordCount < MIN_JOB_WORDS ? "!text-amber-700" : ""}`}>
                  <span className="tabular-nums">{wordCount}</span> of {MIN_JOB_WORDS} words minimum. Specific requirements make the resume analysis more useful.
                </p>
              </div>

              {error && <p role="alert" className="app-notice-error">{error}</p>}

              <div className="app-modal-footer">
                <button type="button" onClick={closeForm} disabled={saving} className="app-button-secondary">Cancel</button>
                <button type="submit" disabled={saving} aria-busy={saving} className="app-button-primary">
                  {saving && <span className="app-spinner !border-white/30 !border-t-white" aria-hidden="true" />}
                  {editingId !== null ? "Save changes" : "Add job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {jobToDelete && (
        <div className="app-modal-backdrop !z-[80]">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-job-title"
            aria-describedby="delete-job-description"
            className="app-modal-panel max-w-md p-6"
          >
            <h2 id="delete-job-title" className="text-lg font-semibold text-slate-900">Delete this job?</h2>
            <div id="delete-job-description" className="mt-2 space-y-2 text-[0.9375rem] leading-6 text-slate-600">
              <p>
                “{jobToDelete.position}” at {jobToDelete.company} will be permanently deleted, along with its resume analysis history.
              </p>
              {deleteApplication && (
                <p className="font-medium text-red-700">
                  Its tracked application{deleteInterviewCount > 0 ? ` and ${deleteInterviewCount} interview${deleteInterviewCount === 1 ? "" : "s"}` : ""} will also be deleted.
                </p>
              )}
              <p>This can’t be undone.</p>
            </div>
            {deleteError && <p role="alert" className="app-notice-error mt-4">{deleteError}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" data-autofocus onClick={() => setJobToDelete(null)} className="app-button-secondary">Cancel</button>
              <button type="button" onClick={confirmDeleteJob} className="app-button-danger">Delete job</button>
            </div>
          </div>
        </div>
      )}

      {analysisJob && (
        <ResumeAnalysisDialog
          key={analysisJob.id}
          job={jobs.find((job) => job.id === analysisJob.id) ?? analysisJob}
          initialView={analysisView}
          onAnalysisChange={refreshJobs}
          onClose={() => setAnalysisJob(null)}
        />
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
