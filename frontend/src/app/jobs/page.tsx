"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, History, Pencil, Plus, Search, Trash2, X } from "lucide-react";
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
import FormField, { fieldProps, focusFirstInvalid } from "@/components/FormField";
import { ListSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/ToastProvider";
import { countWords, MIN_JOB_WORDS, MAX_JOB_CHARACTERS } from "@/lib/jobDescription";
import useDialogControls from "@/hooks/useDialogControls";
import useNewIds from "@/hooks/useNewIds";

const employmentTypes = ["All types", "Full-time", "Part-time", "Contract", "Internship"];

const emptyForm = {
  company: "",
  position: "",
  location: "",
  employmentType: "Full-time",
  salary: "",
  description: "",
};

type JobForm = typeof emptyForm;
type JobErrors = Partial<Record<"company" | "position" | "description", string>>;

function validate(form: JobForm): JobErrors {
  const errors: JobErrors = {};
  if (!form.company.trim()) errors.company = "Enter the company name.";
  if (!form.position.trim()) errors.position = "Enter the position title.";
  const words = countWords(form.description);
  if (form.description.length > MAX_JOB_CHARACTERS) {
    errors.description = "Shorten the description to 20,000 characters or fewer.";
  } else if (words < MIN_JOB_WORDS) {
    errors.description = `Add at least ${MIN_JOB_WORDS - words} more words. Paste the original posting so the resume match has requirements to compare.`;
  }
  return errors;
}

function setUrl(search: string, mode: "push" | "replace" = "push") {
  const url = search ? `/jobs?${search}` : "/jobs";
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

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
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [locationFilter, setLocationFilter] = useState("All locations");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [analysisJob, setAnalysisJob] = useState<Job | null>(null);
  const [analysisView, setAnalysisView] = useState<"new" | "history">("new");
  const urlHandled = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const newIds = useNewIds(jobs.map((job) => job.id), jobsLoading);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setAttempted(false);
    setRequestError("");
  }, []);

  useDialogControls(showForm && !saving, closeForm);
  useDialogControls(jobToDelete !== null, () => setJobToDelete(null));

  function openAddJob() {
    setEditingId(null);
    setForm(emptyForm);
    setAttempted(false);
    setRequestError("");
    setShowForm(true);
  }

  /*
   * URL state: ?id=<job> opens a job, ?new=1 opens the add form,
   * ?analysis=<job>[&view=history] opens the resume analysis.
   */
  useEffect(() => {
    if (urlHandled.current || jobsLoading) return;
    urlHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const id = params.get("id") ?? params.get("analysis");
      if (id && jobs.some((job) => job.id === id)) setSelectedId(id);
      if (params.get("new") === "1") {
        openAddJob();
        setUrl("", "replace");
      }
      const analysisTarget = jobs.find((item) => item.id === params.get("analysis"));
      if (analysisTarget) {
        setAnalysisView(params.get("view") === "history" ? "history" : "new");
        setAnalysisJob(analysisTarget);
        setUrl(`id=${analysisTarget.id}`, "replace");
      }
    });
    return () => { active = false; };
  }, [jobs, jobsLoading]);

  useEffect(() => {
    const syncFromUrl = () => setSelectedId(new URLSearchParams(window.location.search).get("id"));
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const locations = useMemo(() => ["All locations", ...new Set(jobs.map((job) => job.location))], [jobs]);
  const applicationByJob = useMemo(
    () => new Map(applications.map((application) => [application.jobId, application])),
    [applications],
  );

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = `${job.company} ${job.position} ${job.location}`.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All types" || job.employmentType === typeFilter;
    const matchesLocation = locationFilter === "All locations" || job.location === locationFilter;
    return matchesSearch && matchesType && matchesLocation;
  });
  const filtersActive = search !== "" || typeFilter !== "All types" || locationFilter !== "All locations";

  // Wide screens always show a record; phones show the list until one is chosen.
  const selectedJob = jobs.find((job) => job.id === selectedId) ?? null;
  const shownJob = selectedJob ?? filteredJobs[0] ?? null;

  function selectJob(id: string | null) {
    setSelectedId(id);
    setUrl(id ? `id=${id}` : "");
    if (id) window.requestAnimationFrame(() => document.getElementById("job-detail-title")?.focus({ preventScroll: window.innerWidth >= 1024 }));
  }

  function clearFilters() {
    setSearch("");
    setTypeFilter("All types");
    setLocationFilter("All locations");
  }

  function openEditJob(job: Job) {
    setEditingId(job.id);
    setForm({
      company: job.company,
      position: job.position,
      location: job.location,
      employmentType: job.employmentType,
      salary: job.salary === "Not specified" ? "" : job.salary,
      description: job.description,
    });
    setAttempted(false);
    setRequestError("");
    setShowForm(true);
  }

  const errors = attempted ? validate(form) : {};

  async function handleSaveJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (Object.keys(validate(form)).length > 0) {
      focusFirstInvalid(formRef.current);
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
    setRequestError("");
    try {
      if (editingId !== null) {
        await updateJob(editingId, jobData);
        toast("Job updated.");
      } else {
        await createJob(jobData);
        toast(`${jobData.position} added.`);
        clearFilters();
      }
      closeForm();
    } catch (error) {
      // Entered values stay in the form so nothing has to be retyped.
      setRequestError(error instanceof Error ? error.message : "The job could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteJob() {
    if (!jobToDelete) return;
    setDeleteError("");
    try {
      await deleteJob(jobToDelete.id);
      toast(`${jobToDelete.position} deleted.`);
      if (selectedId === jobToDelete.id) selectJob(null);
      setLocationFilter("All locations");
      setJobToDelete(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "The job could not be deleted. Try again.");
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
        <div className={selectedJob ? "hidden lg:block" : ""}>
          <PageHeader
            title="Jobs"
            description="Roles you’re considering. Open one to read it in full, compare your resume, or track your application."
            action={
              <button type="button" onClick={openAddJob} className="app-button-primary">
                <Plus size={18} aria-hidden="true" />
                Add job
              </button>
            }
          />
        </div>

        {jobsError && <p role="alert" className="app-notice-error">{jobsError}</p>}

        {jobsLoading && jobs.length === 0 && <ListSkeleton rows={5} label="Loading your jobs" />}

        {!jobsLoading && jobs.length === 0 && !jobsError && (
          <div className="app-enter app-empty-state" style={{ "--i": 1 } as CSSProperties}>
            <h2 className="app-section-title">No jobs yet</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-slate-600">
              Add a role you’re interested in. Include the full description so your resume has something to be compared against.
            </p>
            <button type="button" onClick={openAddJob} className="app-button-secondary mt-5">
              <Plus size={17} aria-hidden="true" />Add your first job
            </button>
          </div>
        )}

        {jobs.length > 0 && (
          <div
            className="app-enter grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]"
            style={{ "--i": 1 } as CSSProperties}
          >
            {/* Index of records */}
            <section aria-label="Job list" className={selectedJob ? "hidden lg:block" : ""}>
              <div className="space-y-2">
                <label className="app-search-control flex items-center gap-2 border px-3">
                  <Search size={17} className="text-slate-500" aria-hidden="true" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search company, role, or location"
                    aria-label="Search jobs"
                    className="h-11 w-full min-w-0 bg-transparent text-[0.9375rem] outline-none"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Employment type" className="form-input">
                    {employmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} aria-label="Location" className="form-input">
                    {locations.map((location) => <option key={location} value={location}>{location}</option>)}
                  </select>
                </div>
              </div>

              <div className="app-filter-summary !mt-3">
                <p aria-live="polite">
                  <span className="font-semibold text-slate-800">{filteredJobs.length}</span> of {jobs.length} jobs
                </p>
                {filtersActive && <button type="button" onClick={clearFilters} className="app-button-text">Clear filters</button>}
              </div>

              {filteredJobs.length === 0 ? (
                <div className="app-empty-state mt-3 !py-8">
                  <p className="font-medium text-slate-800">No jobs match these filters</p>
                  <button type="button" onClick={clearFilters} className="app-button-secondary app-button-compact mt-4">Clear filters</button>
                </div>
              ) : (
                <ul className="app-surface mt-3 divide-y divide-slate-200 overflow-hidden">
                  {filteredJobs.map((job) => {
                    const application = applicationByJob.get(job.id);
                    return (
                      <li key={job.id} className={newIds.has(job.id) ? "app-item-new" : undefined}>
                        <button
                          type="button"
                          onClick={() => selectJob(job.id)}
                          aria-current={selectedJob?.id === job.id ? "true" : undefined}
                          data-default={!selectedJob && shownJob?.id === job.id ? "true" : undefined}
                          className="app-record-row"
                        >
                          <span className="flex items-start justify-between gap-3">
                            <span className="min-w-0">
                              <span className="block font-medium leading-snug text-slate-900">{job.position}</span>
                              <span className="mt-0.5 block truncate text-sm text-slate-600">{job.company} · {job.location}</span>
                            </span>
                            {application ? <StatusChip status={application.status} /> : null}
                          </span>
                          {job.latestAnalysisScore !== null && (
                            <span className={`mt-1.5 block text-[0.8125rem] ${job.latestAnalysisIsStale ? "text-amber-700" : "text-slate-500"}`}>
                              Resume match {job.latestAnalysisScore}/100{job.latestAnalysisIsStale ? " · out of date" : ""}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* The open record */}
            {shownJob && (
              <section
                aria-labelledby="job-detail-title"
                className={`app-surface lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto ${selectedJob ? "" : "hidden lg:block"}`}
              >
                <JobDetail
                  job={shownJob}
                  application={applicationByJob.get(shownJob.id)}
                  onBack={() => selectJob(null)}
                  onAnalyze={(view) => { setAnalysisView(view); setAnalysisJob(shownJob); }}
                  onEdit={() => openEditJob(shownJob)}
                  onDelete={() => { setDeleteError(""); setJobToDelete(shownJob); }}
                />
              </section>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="app-modal-backdrop app-modal-backdrop-scroll">
          <div role="dialog" aria-modal="true" aria-labelledby="job-form-title" className="app-modal-panel app-modal-sheet my-auto max-w-xl">
            <div className="app-modal-header">
              <div>
                <h2 id="job-form-title" className="text-xl font-semibold">{editingId !== null ? "Edit job" : "Add job"}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId !== null ? "Update the details of this role." : "Record a role you want to pursue."}
                </p>
              </div>
              <button type="button" aria-label="Close" title="Close" onClick={closeForm} disabled={saving} className="app-icon-button app-icon-button-ghost">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form ref={formRef} noValidate onSubmit={handleSaveJob} className="space-y-6 p-6">
              <fieldset className="space-y-4">
                <legend className="mb-3 text-sm font-semibold text-slate-900">The role</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField id="job-company" label="Company" required error={errors.company}>
                    <input
                      {...fieldProps("job-company", errors.company)}
                      data-autofocus
                      value={form.company}
                      onChange={(event) => setForm({ ...form, company: event.target.value })}
                      autoComplete="organization"
                      className="form-input"
                    />
                  </FormField>
                  <FormField id="job-position" label="Position" required error={errors.position}>
                    <input
                      {...fieldProps("job-position", errors.position)}
                      value={form.position}
                      onChange={(event) => setForm({ ...form, position: event.target.value })}
                      autoComplete="organization-title"
                      className="form-input"
                    />
                  </FormField>
                  <FormField id="job-location" label="Location">
                    <input
                      id="job-location"
                      value={form.location}
                      onChange={(event) => setForm({ ...form, location: event.target.value })}
                      placeholder="City, or Remote"
                      className="form-input"
                    />
                  </FormField>
                  <FormField id="job-type" label="Employment type">
                    <select id="job-type" value={form.employmentType} onChange={(event) => setForm({ ...form, employmentType: event.target.value })} className="form-input">
                      {employmentTypes.slice(1).map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </FormField>
                </div>
                <FormField id="job-salary" label="Salary">
                  <input
                    id="job-salary"
                    value={form.salary}
                    onChange={(event) => setForm({ ...form, salary: event.target.value })}
                    placeholder="₱30,000–₱40,000 / month"
                    className="form-input"
                  />
                </FormField>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-slate-900">The posting</legend>
                <FormField
                  id="job-description"
                  label="Job description"
                  required
                  error={errors.description}
                  hint={<><span className="tabular-nums">{wordCount}</span> of {MIN_JOB_WORDS} words minimum. Paste the original posting where possible.</>}
                >
                  <DescriptionFormattingToolbar
                    textareaRef={descriptionRef}
                    value={form.description}
                    maxLength={MAX_JOB_CHARACTERS}
                    onChange={(description) => setForm({ ...form, description })}
                  />
                  <textarea
                    {...fieldProps("job-description", errors.description, true)}
                    ref={descriptionRef}
                    rows={10}
                    maxLength={MAX_JOB_CHARACTERS}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Responsibilities, required skills, experience, and qualifications"
                    className="form-input resize-y !rounded-t-none"
                  />
                </FormField>
              </fieldset>

              {requestError && <p role="alert" className="app-notice-error">{requestError}</p>}

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
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-job-title" aria-describedby="delete-job-description" className="app-modal-panel max-w-md p-6">
            <h2 id="delete-job-title" className="text-lg font-semibold text-slate-900">Delete this job?</h2>
            <div id="delete-job-description" className="mt-2 space-y-2 text-[0.9375rem] leading-6 text-slate-600">
              <p>“{jobToDelete.position}” at {jobToDelete.company} will be permanently deleted, along with its resume analysis history.</p>
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

function JobDetail({
  job,
  application,
  onBack,
  onAnalyze,
  onEdit,
  onDelete,
}: {
  job: Job;
  application: ReturnType<typeof useApplications>["applications"][number] | undefined;
  onBack: () => void;
  onAnalyze: (view: "new" | "history") => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article>
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <button type="button" onClick={onBack} className="app-button-text mb-4 lg:hidden">
          <ArrowLeft size={16} aria-hidden="true" />All jobs
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="job-detail-title" tabIndex={-1} className="text-[1.4375rem] font-semibold leading-tight text-slate-900 outline-none">
              {job.position}
            </h2>
            <p className="mt-1 text-[0.9375rem] text-slate-700">{job.company}</p>
          </div>
          <ActionMenu
            label={`More actions for ${job.position} at ${job.company}`}
            items={[
              { label: "Analysis history", icon: History, onSelect: () => onAnalyze("history") },
              { label: "Edit job", icon: Pencil, onSelect: onEdit },
              "separator",
              { label: "Delete job", icon: Trash2, tone: "danger", onSelect: onDelete },
            ]}
          />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <Detail term="Location" value={job.location} />
          <Detail term="Type" value={job.employmentType} />
          <Detail term="Salary" value={job.salary} />
          <Detail term="Added" value={job.dateAdded} />
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onAnalyze("new")} className="app-button-secondary app-button-compact">
            {job.latestAnalysisIsStale ? "Re-run resume match" : job.latestAnalysisScore !== null ? "Compare again" : "Compare my resume"}
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
          {application && <span className="ml-auto"><StatusChip status={application.status} /></span>}
        </div>
      </div>

      {job.latestAnalysisScore !== null && (
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          {job.latestAnalysisIsStale ? (
            <div role="status" className="app-notice-warning flex-col !gap-1">
              <p className="font-semibold">Resume match is out of date (was {job.latestAnalysisScore}/100)</p>
              <ul className="list-disc pl-5">
                {job.latestAnalysisStaleReasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            </div>
          ) : (
            <p className="flex flex-wrap items-baseline gap-x-3 text-sm text-slate-600">
              <span>
                Resume match <span className="text-base font-semibold tabular-nums text-slate-900">{job.latestAnalysisScore}/100</span>
              </span>
              <button type="button" onClick={() => onAnalyze("history")} className="app-button-text">See what matched</button>
            </p>
          )}
        </div>
      )}

      <div className="p-5 sm:p-6">
        <h3 className="mb-3 text-base font-semibold text-slate-900">Job description</h3>
        <JobDescription description={job.description} collapsible={false} headingLevel={4} />
      </div>
    </article>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-slate-500">{term}</dt>
      <dd className="mt-0.5 truncate text-slate-900">{value}</dd>
    </div>
  );
}
