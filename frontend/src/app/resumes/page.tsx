"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  X,
  Download,
  Pencil,
  Trash2,
  Star,
  Upload,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { useResumes, type Resume } from "@/components/ResumesProvider";
import { useSkills } from "@/components/SkillsProvider";
import useDialogControls from "@/hooks/useDialogControls";
import ExpandableText from "@/components/ExpandableText";
import ExpandableSkillList from "@/components/ExpandableSkillList";
import ActionMenu from "@/components/ActionMenu";
import { focusFirstInvalid } from "@/components/FormField";
import { ListSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/ToastProvider";
import { useApplications } from "@/components/ApplicationsProvider";

const emptyForm = {
  name: "",
  targetRole: "",
  fileName: "",
  skills: [] as string[],
  notes: "",
};

function formatDate(date: string) {
  if (!date) return "Not set";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ResumesPage() {
  const { resumes, createResume, updateResume, setAsDefault, deleteResume, downloadResume, extractResume, isLoading, error: resumesError } = useResumes();
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const { skills: availableSkills, isLoading: skillsLoading } = useSkills();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"name" | "targetRole" | "file", string>>>({});
  const toast = useToast();
  const setNotice = (text: string) => toast(text);
  const { applications } = useApplications();
  const usageByResume = useMemo(() => {
    const counts = new Map<string, number>();
    applications.forEach((application) => {
      if (application.resumeId) counts.set(application.resumeId, (counts.get(application.resumeId) ?? 0) + 1);
    });
    return counts;
  }, [applications]);
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");

  useDialogControls(showModal && !saving, () => setShowModal(false));
  useDialogControls(resumeToDelete !== null, () => setResumeToDelete(null));

  const filteredAvailableSkills = availableSkills.filter((skill) =>
    skill.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  const roles = useMemo(() => {
    return Array.from(
      new Set(resumes.map((resume) => resume.targetRole).filter(Boolean)),
    );
  }, [resumes]);

  const filteredResumes = useMemo(() => {
    return resumes.filter((resume) => {
      const searchText =
        `${resume.name} ${resume.targetRole} ${resume.fileName} ${resume.skills.join(" ")}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesRole =
        roleFilter === "All" || resume.targetRole === roleFilter;

      return matchesSearch && matchesRole;
    }).sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.updatedAt.localeCompare(a.updatedAt));
  }, [resumes, search, roleFilter]);

  const defaultResume = resumes.find((resume) => resume.isDefault);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setMessage("");
    setFieldErrors({});
    setSkillsOpen(false);
    setSkillSearch("");
    setShowModal(true);
  }

  function openEditModal(resume: Resume) {
    setFieldErrors({});
    setEditingId(resume.id);
    setForm({
      name: resume.name,
      targetRole: resume.targetRole,
      fileName: resume.fileName,
      skills: resume.skills,
      notes: resume.notes,
    });
    setSelectedFile(null);
    setMessage("");
    setSkillsOpen(false);
    setSkillSearch("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    const errors: typeof fieldErrors = {};
    if (!form.name.trim()) errors.name = "Name this version, for example “Frontend resume”.";
    if (!form.targetRole.trim()) errors.targetRole = "Enter the kind of role this version targets.";
    if (editingId === null && !selectedFile) errors.file = "Choose a PDF or DOCX file to upload.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(e.currentTarget);
      return;
    }

    const fileName = selectedFile
      ? selectedFile.name
      : form.fileName.trim();

    setSaving(true);
    setMessage("");
    try {
      const resumeData = { name: form.name.trim(), targetRole: form.targetRole.trim(), fileName, file: selectedFile ?? undefined, skills: form.skills, notes: form.notes.trim() };
      if (editingId !== null) await updateResume(editingId, resumeData);
      else await createResume(resumeData);
      setNotice(editingId !== null ? `Saved changes to ${resumeData.name}.` : `Uploaded ${resumeData.name}.`);
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "Unable to save resume.");
      return;
    } finally {
      setSaving(false);
    }


    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setMessage("");
  }

  async function confirmDeleteResume() {
    if (!resumeToDelete) return;
    try {
      await deleteResume(resumeToDelete.id);
      setNotice(`Deleted ${resumeToDelete.name}.`);
      setResumeToDelete(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "The resume could not be deleted. Try again.");
      setResumeToDelete(null);
    }
  }

  async function downloadResumeInfo(resume: Resume) {
    setMessage("");
    try { await downloadResume(resume); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to download resume."); }
  }

  async function handleExtract(id: string) {
    if (extractingId) return;
    setExtractingId(id);
    setMessage("");
    try { await extractResume(id); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to extract resume text."); }
    finally { setExtractingId(null); }
  }

  const inputClass = "form-input";

  const filtersActive = search !== "" || roleFilter !== "All";

  return (
    <WorkspaceLayout>
      <div className="app-page space-y-6">
        <PageHeader
          title="Resumes"
          description={
            defaultResume
              ? `${resumes.length} ${resumes.length === 1 ? "version" : "versions"}. ${defaultResume.name} is your default.`
              : "Keep a version for each kind of role you apply for."
          }
          action={
            <button type="button" onClick={openAddModal} className="app-button-primary">
              <Plus size={18} aria-hidden="true" />
              Upload resume
            </button>
          }
        />
        {message && !showModal && <p role="alert" className="app-notice-error">{message}</p>}
        {isLoading && resumes.length === 0 && <ListSkeleton rows={2} label="Loading resumes" />}
        {resumesError && <p role="alert" className="app-notice-error">{resumesError}</p>}

        {!isLoading && resumes.length === 0 && !resumesError && (
          <div className="app-empty-state">
            <h2 className="app-section-title">No resumes yet</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-slate-500">
              Upload a text-based PDF or DOCX. CareerTrack reads its text so you can compare it with your saved jobs.
            </p>
            <button type="button" onClick={openAddModal} className="app-button-secondary mt-5">
              <Upload size={17} aria-hidden="true" />Upload your first resume
            </button>
          </div>
        )}

        {resumes.length > 0 && (
          <>
            <section aria-label="Filter resumes" className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="app-search-control flex flex-1 items-center gap-2 border px-3">
                <Search size={17} className="text-slate-500" aria-hidden="true" />
                <input
                  aria-label="Search resumes"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, role, file, or skill"
                  className="h-11 w-full min-w-0 bg-transparent text-[0.9375rem] outline-none"
                />
              </label>
              {roles.length > 1 && (
                <select
                  aria-label="Target role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="form-input sm:w-52"
                >
                  <option value="All">All target roles</option>
                  {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              )}
            </section>

            <div className="app-filter-summary !mt-0">
              <p aria-live="polite">
                Showing <span className="font-semibold text-slate-800">{filteredResumes.length}</span> of {resumes.length} resumes
              </p>
              {filtersActive && (
                <button type="button" onClick={() => { setSearch(""); setRoleFilter("All"); }} className="app-button-text">Clear filters</button>
              )}
            </div>

            {filteredResumes.length === 0 ? (
              <div className="app-empty-state"><p className="font-medium text-slate-800">No resumes match these filters</p></div>
            ) : (
              <ul className="app-surface divide-y divide-slate-200">
                {filteredResumes.map((resume) => (
                  <li key={resume.id}>
                    <article aria-labelledby={`resume-${resume.id}-title`} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 id={`resume-${resume.id}-title`} className="text-[1.0625rem] font-semibold text-slate-900">{resume.name}</h2>
                          {resume.isDefault && (
                            <span className="app-chip app-chip-active"><Star size={12} aria-hidden="true" />Default</span>
                          )}
                        </div>
                        <p className="text-[0.9375rem] text-slate-700">For {resume.targetRole}</p>
                        <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <FileText size={15} aria-hidden="true" />
                            <span className="truncate">{resume.fileName}{!resume.hasFile && " (no file uploaded)"}</span>
                          </span>
                          <span>Updated {formatDate(resume.updatedAt)}</span>
                          <span>
                            {usageByResume.get(resume.id)
                              ? `Used in ${usageByResume.get(resume.id)} ${usageByResume.get(resume.id) === 1 ? "application" : "applications"}`
                              : "Not used in an application yet"}
                          </span>
                        </p>

                        {resume.hasFile && resume.extractionStatus !== "ready" && (
                          <div className="app-notice-warning mt-3 flex-col !gap-1" aria-live="polite">
                            <p>
                              {resume.extractionStatus === "unavailable"
                                ? "No readable text was found, so this resume can’t be analyzed. The file may be scanned, password-protected, or damaged. Upload a text-based PDF or DOCX instead."
                                : "This file hasn’t been read yet. Extract its text before analyzing it."}
                            </p>
                            <button type="button" disabled={extractingId !== null} onClick={() => handleExtract(resume.id)} className="app-button-text self-start !text-amber-800">
                              {extractingId === resume.id ? "Extracting…" : resume.extractionStatus === "unavailable" ? "Try again" : "Extract text"}
                            </button>
                          </div>
                        )}
                        {resume.hasFile && resume.extractionStatus === "ready" && (
                          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-emerald-700">
                            <Check size={15} aria-hidden="true" />Ready for analysis
                          </p>
                        )}

                        {resume.skills.length > 0 && (
                          <div className="mt-3">
                            <h3 className="sr-only">Skills</h3>
                            <ExpandableSkillList skills={resume.skills} />
                          </div>
                        )}
                        {resume.notes && (
                          <div className="mt-3 max-w-[72ch] text-sm text-slate-600"><ExpandableText text={resume.notes} /></div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => downloadResumeInfo(resume)}
                          disabled={!resume.hasFile}
                          className="app-button-secondary app-button-compact"
                        >
                          <Download size={16} aria-hidden="true" />
                          Download<span className="sr-only"> {resume.name}</span>
                        </button>
                        <ActionMenu
                          label={`More actions for ${resume.name}`}
                          items={[
                            {
                              label: "Make default",
                              icon: Star,
                              disabled: resume.isDefault,
                              onSelect: async () => {
                                try {
                                  await setAsDefault(resume.id);
                                  setNotice(`${resume.name} is now your default resume.`);
                                } catch (error) {
                                  setMessage(error instanceof Error ? error.message : "The default resume could not be changed.");
                                }
                              },
                            },
                            { label: "Edit details", icon: Pencil, onSelect: () => openEditModal(resume) },
                            "separator",
                            { label: "Delete resume", icon: Trash2, tone: "danger", onSelect: () => setResumeToDelete(resume) },
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

      {showModal && (
        <div className="app-modal-backdrop app-modal-backdrop-scroll">
          <div role="dialog" aria-modal="true" aria-labelledby="resume-form-title" className="app-modal-panel app-modal-sheet my-auto max-w-2xl">
            <div className="app-modal-header">
              <div>
                <h2 id="resume-form-title" className="text-xl font-semibold">
                  {editingId !== null ? "Edit resume" : "Upload resume"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId !== null ? "Update details, or replace the file." : "Add a resume version to your library."}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowModal(false)}
                aria-label="Close"
                className="app-icon-button app-icon-button-ghost"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form
              noValidate
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="resume-name" className="app-field-label">
                    Name<span className="font-normal text-slate-500"> (required)</span>
                  </label>
                  <input
                    id="resume-name"
                    data-autofocus
                    aria-invalid={fieldErrors.name ? true : undefined}
                    aria-describedby={fieldErrors.name ? "resume-name-error" : undefined}
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (fieldErrors.name && e.target.value.trim()) setFieldErrors({ ...fieldErrors, name: undefined });
                    }}
                    placeholder="Frontend resume"
                    className={inputClass}
                  />
                  {fieldErrors.name && <p id="resume-name-error" className="app-field-error">{fieldErrors.name}</p>}
                </div>

                <div>
                  <label htmlFor="resume-role" className="app-field-label">
                    Target role<span className="font-normal text-slate-500"> (required)</span>
                  </label>
                  <input
                    id="resume-role"
                    aria-invalid={fieldErrors.targetRole ? true : undefined}
                    aria-describedby={fieldErrors.targetRole ? "resume-role-error" : undefined}
                    value={form.targetRole}
                    onChange={(e) => {
                      setForm({ ...form, targetRole: e.target.value });
                      if (fieldErrors.targetRole && e.target.value.trim()) setFieldErrors({ ...fieldErrors, targetRole: undefined });
                    }}
                    placeholder="Frontend Developer"
                    className={inputClass}
                  />
                  {fieldErrors.targetRole && <p id="resume-role-error" className="app-field-error">{fieldErrors.targetRole}</p>}
                </div>

                <div className="sm:col-span-2">
                  <span id="resume-file-label" className="app-field-label">
                    File{editingId === null ? <span className="font-normal text-slate-500"> (required)</span> : null}
                  </span>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-slate-300 p-6 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 focus-within:border-cyan-600 focus-within:ring-[3px] focus-within:ring-cyan-600/25">
                    <Upload size={24} className="text-indigo-600" aria-hidden="true" />
                    <span className="mt-2 text-sm font-medium text-slate-800">
                      {selectedFile
                        ? selectedFile.name
                        : editingId !== null
                          ? "Choose a replacement file (optional)"
                          : "Choose a PDF or DOCX file"}
                    </span>
                    <span className="mt-1 text-[0.8125rem] text-slate-500">
                      {selectedFile
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        : "Browse your files"}
                    </span>

                    <input
                      type="file"
                      aria-labelledby="resume-file-label"
                      aria-describedby={fieldErrors.file ? "resume-file-error" : "resume-file-help"}
                      aria-invalid={fieldErrors.file ? true : undefined}
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;

                        if (file && (!/\.(pdf|docx)$/i.test(file.name) || file.size === 0 || file.size > 10 * 1024 * 1024)) {
                          setFieldErrors({ ...fieldErrors, file: "Choose a PDF or DOCX file that isn’t empty and is 10 MB or smaller." });
                          e.target.value = "";
                          setSelectedFile(null);
                          return;
                        }

                        setFieldErrors({ ...fieldErrors, file: undefined });
                        setSelectedFile(file);
                      }}
                    />
                  </label>

                  {fieldErrors.file ? (
                    <p id="resume-file-error" className="app-field-error">{fieldErrors.file}</p>
                  ) : (
                    <p id="resume-file-help" className="app-field-hint">
                      PDF or DOCX, up to 10 MB, stored privately. Scanned documents can’t be read; use a text-based file.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <span id="resume-skills-label" className="app-field-label">Skills</span>
                  {skillsLoading ? (
                    <p className="text-sm text-gray-500">Loading your skills...</p>
                  ) : availableSkills.length === 0 ? (
                    <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                      Add skills from the Skills page before assigning them to a resume.
                    </p>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSkillsOpen((open) => !open)}
                        aria-expanded={skillsOpen}
                        aria-labelledby="resume-skills-label"
                        className="form-input flex min-h-11 items-center justify-between !py-1.5 !pr-1.5 text-left"
                      >
                        <span className="flex min-w-0 flex-wrap gap-2">
                          {form.skills.length > 0 ? (
                            form.skills.map((skill) => (
                              <span key={skill} className="break-words rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.8125rem] text-slate-700">
                                {skill}
                              </span>
                            ))
                          ) : <span className="text-slate-500">Choose skills</span>}
                        </span>
                        <span aria-hidden="true" className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center text-slate-500">
                          {skillsOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                        </span>
                      </button>

                      {skillsOpen && (
                        <div className="absolute z-10 mt-1 w-full rounded-[var(--radius-card)] border border-slate-200 bg-white p-2 shadow-[var(--shadow-raised)]">
                          <div className="relative">
                            <Search
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                              autoFocus
                              aria-label="Search skills"
                              value={skillSearch}
                              onChange={(event) => setSkillSearch(event.target.value)}
                              placeholder="Search skills"
                              className="form-input !pl-9"
                            />
                          </div>

                          <div className="mt-2 max-h-44 overflow-y-auto">
                            {filteredAvailableSkills.length === 0 ? (
                              <p className="p-3 text-sm text-gray-500">No matching skills.</p>
                            ) : (
                              filteredAvailableSkills.map((skill) => {
                                const selected = form.skills.includes(skill.name);

                                return (
                                  <button
                                    key={skill.id}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() =>
                                      setForm({
                                        ...form,
                                        skills: selected
                                          ? form.skills.filter((name) => name !== skill.name)
                                          : [...form.skills, skill.name],
                                      })
                                    }
                                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${selected ? "bg-indigo-50 font-medium text-indigo-800" : "text-slate-700 hover:bg-slate-50"}`}
                                  >
                                    <span>{skill.name}</span>
                                    {selected && <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-700"><Check size={14} strokeWidth={3} /></span>}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="resume-notes" className="app-field-label">Notes</label>
                  <textarea
                    id="resume-notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    placeholder="Describe what this resume focuses on..."
                    className={inputClass}
                  />
                </div>
              </div>

              {message && <p role="alert" className="app-notice-error">{message}</p>}

              <div className="app-modal-footer">
                <button
                  type="button"
                  disabled={saving}
                onClick={() => setShowModal(false)}
                  className="app-button-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  aria-busy={saving}
                  className="app-button-primary"
                >
                  {saving && <span className="app-spinner !border-white/30 !border-t-white" aria-hidden="true" />}
                  {saving ? "Uploading and reading…" : editingId !== null ? "Save changes" : "Upload resume"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resumeToDelete && (
        <div className="app-modal-backdrop !z-[80]">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-resume-title" aria-describedby="delete-resume-description" className="app-modal-panel max-w-md p-6">
            <h2 id="delete-resume-title" className="text-lg font-semibold text-slate-900">Delete this resume?</h2>
            <p id="delete-resume-description" className="mt-2 text-[0.9375rem] leading-6 text-slate-600">
              “{resumeToDelete.name}” and its uploaded file will be permanently deleted. Applications that used it will show no resume. Past analyses keep their results. This can’t be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" data-autofocus onClick={() => setResumeToDelete(null)} className="app-button-secondary">Cancel</button>
              <button type="button" onClick={confirmDeleteResume} className="app-button-danger">Delete resume</button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
