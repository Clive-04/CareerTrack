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
  BriefcaseBusiness,
  CalendarDays,
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
import MetricCard from "@/components/MetricCard";

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
    });
  }, [resumes, search, roleFilter]);

  const defaultResume = resumes.find((resume) => resume.isDefault);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setMessage("");
    setSkillsOpen(false);
    setSkillSearch("");
    setShowModal(true);
  }

  function openEditModal(resume: Resume) {
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

    if (!form.name.trim() || !form.targetRole.trim()) {
      setMessage(
        "Resume name and target role are required and cannot contain only spaces.",
      );
      return;
    }

    const fileName = selectedFile
      ? selectedFile.name
      : form.fileName.trim();

    if (editingId === null && !selectedFile) {
      setMessage("Please select a resume file before adding it.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const resumeData = { name: form.name.trim(), targetRole: form.targetRole.trim(), fileName, file: selectedFile ?? undefined, skills: form.skills, notes: form.notes.trim() };
      if (editingId !== null) await updateResume(editingId, resumeData);
      else await createResume(resumeData);
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

  async function confirmDeleteResume() { if (!resumeToDelete) return; try { await deleteResume(resumeToDelete.id); setResumeToDelete(null); } catch (e) { setMessage(e instanceof Error ? e.message : "Unable to delete resume."); } }

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

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <WorkspaceLayout>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
        <PageHeader
          eyebrow="Your documents"
          title="Resumes"
          description="Manage your resume versions for different job opportunities."
          action={
            <button
              type="button"
              onClick={openAddModal}
              className="app-button-primary self-start"
            >
              <Plus size={18} />
              Add Resume
            </button>
          }
        />
        {message && !showModal && <p role="alert" className="app-notice-error">{message}</p>}
        {isLoading && <div role="status" className="app-loading-state"><span className="app-spinner" aria-hidden="true" />Loading resumes...</div>}
        {resumesError && <p role="alert" className="app-notice-error">{resumesError}</p>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Total Resumes" value={resumes.length} icon={FileText} tone="indigo" />
          <MetricCard label="Target Roles" value={roles.length} icon={BriefcaseBusiness} tone="blue" />
          <MetricCard label="Default Resume" value={defaultResume?.name ?? "Not set"} icon={Star} tone="amber" compactValue />
        </section>

        <section className="app-surface overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Your Resume Library
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Keep different versions ready for different job roles.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="app-search-control relative flex items-center rounded-xl border border-slate-200 bg-white">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  aria-label="Search resumes"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search resumes..."
                  className="w-full rounded-xl bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none sm:w-56"
                />
              </label>

              <select
                aria-label="Filter resumes by target role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="All">All target roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredResumes.length === 0 ? (
              <div className="app-empty-state md:col-span-2 xl:col-span-3">
                <FileText size={36} className="mx-auto text-gray-300" />
                <p className="mt-3 font-medium text-gray-700">
                  No resumes found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Try another search or add a resume.
                </p>
              </div>
            ) : (
              filteredResumes.map((resume) => (
                <article
                  key={resume.id}
                  className="resume-library-card app-data-card flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="resume-card-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                        <FileText size={23} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-950">
                          {resume.name}
                        </h3>
                        <p className="mt-0.5 truncate text-sm text-slate-500">
                          {resume.targetRole}
                        </p>
                      </div>
                    </div>

                    {resume.isDefault && (
                      <span className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <Star size={13} />
                        Default
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                    <FileText size={16} className="shrink-0 text-slate-400" />
                    <span className="truncate text-xs font-medium text-slate-600">
                      {resume.fileName}{!resume.hasFile && " (file not uploaded)"}
                    </span>
                  </div>

                  {resume.hasFile && (
                    <div className="mt-3 text-sm" aria-live="polite">
                      {resume.extractionStatus === "ready" ? (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                          Text extracted — ready for analysis
                        </p>
                      ) : (
                        <>
                          <p className="text-amber-700">
                            {resume.extractionStatus === "unavailable"
                              ? "No readable text could be extracted. The file may be scanned, password-protected, damaged, or too complex. Upload a text-based PDF or DOCX through Edit."
                              : "This file has not been checked for readable text yet."}
                          </p>
                          <button type="button" disabled={extractingId !== null} onClick={() => handleExtract(resume.id)} className="app-button-text mt-2 disabled:opacity-50">
                            {extractingId === resume.id ? "Extracting..." : resume.extractionStatus === "unavailable" ? "Retry extraction" : "Extract text"}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Skills
                    </p>
                    <ExpandableSkillList skills={resume.skills} />
                  </div>

                  {resume.notes && (
                    <ExpandableText text={resume.notes} className="mt-4 text-sm leading-6 text-slate-500" />
                  )}

                  <div className="resume-card-date flex items-center gap-1.5 text-xs text-gray-400">
                    <CalendarDays size={14} />
                    Updated {formatDate(resume.updatedAt)}
                  </div>

                  <div className="resume-card-actions-simple app-card-actions">
                    <button
                      type="button"
                      onClick={() => openEditModal(resume)}
                      className="app-button-secondary flex-1"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadResumeInfo(resume)}
                      disabled={!resume.hasFile}
                      title={resume.hasFile ? "Download resume" : "Edit this resume to upload its file"}
                      aria-label={`Download ${resume.name}`}
                      className="app-icon-button"
                    >
                      <Download size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setAsDefault(resume.id)}
                      disabled={resume.isDefault}
                      title="Set as default resume"
                      aria-label={`Set ${resume.name} as default`}
                      className="app-icon-button !text-amber-600 hover:!bg-amber-50 disabled:opacity-40"
                    >
                      <Star size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setResumeToDelete(resume)}
                      title="Delete resume"
                      aria-label={`Delete ${resume.name}`}
                      className="app-icon-button hover:!border-red-200 hover:!bg-red-50 hover:!text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="app-results-footer flex flex-wrap items-center justify-between gap-3">
            <span>Showing {filteredResumes.length} of {resumes.length} resumes</span>
            {(search || roleFilter !== "All") && (
              <button type="button" onClick={() => { setSearch(""); setRoleFilter("All"); }} className="app-button-text">
                Clear filters
              </button>
            )}
          </div>
        </section>
      </div>

      {showModal && (
        <div className="app-modal-backdrop app-modal-backdrop-scroll">
          <div role="dialog" aria-modal="true" aria-labelledby="resume-form-title" className="app-modal-panel my-auto max-w-2xl">
            <div className={`flex items-center justify-between border-b px-6 py-5 ${editingId !== null ? "border-amber-200 bg-amber-50/70" : "border-indigo-200 bg-indigo-50/70"}`}>
              <div>
                <h2 id="resume-form-title" className={`text-lg font-bold ${editingId !== null ? "text-amber-950" : "text-indigo-950"}`}>
                  {editingId !== null ? "Edit Resume" : "Add Resume"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Add a resume version to your library.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setShowModal(false)}
                aria-label="Close form"
                className="app-icon-button app-icon-button-ghost shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <form
              noValidate
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Resume Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g. Software Developer Resume"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Target Role *
                  </label>
                  <input
                    required
                    value={form.targetRole}
                    onChange={(e) =>
                      setForm({ ...form, targetRole: e.target.value })
                    }
                    placeholder="e.g. Frontend Developer"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">
                    Resume File {editingId === null ? "*" : ""}
                  </label>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                    <Upload size={28} className="text-blue-500" />
                    <span className="mt-2 text-sm font-medium text-gray-700">
                      {selectedFile
                        ? selectedFile.name
                        : editingId !== null
                          ? "Choose a replacement file (optional)"
                          : "Choose a PDF or DOCX file"}
                    </span>
                    <span className="mt-1 text-xs text-gray-400">
                      {selectedFile
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        : "Select a file from your computer"}
                    </span>

                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      required={editingId === null}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;

                        if (file && (!/\.(pdf|docx)$/i.test(file.name) || file.size === 0 || file.size > 10 * 1024 * 1024)) {
                          setMessage("Choose a non-empty PDF or DOCX file, 10 MB or smaller.");
                          e.target.value = "";
                          setSelectedFile(null);
                          return;
                        }

                        setMessage("");
                        setSelectedFile(file);
                      }}
                    />
                  </label>

                  <p className="mt-2 text-xs text-gray-400">
                    PDF or DOCX, up to 10 MB. Your file stays private. Text is extracted locally; scanned documents need a text-based replacement.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">
                    Skills
                  </label>
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
                        className="flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-2 text-left text-sm text-slate-700 shadow-sm outline-none transition hover:border-indigo-300 hover:shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      >
                        <span className="flex min-w-0 flex-wrap gap-2">
                          {form.skills.length > 0 ? (
                            form.skills.map((skill) => (
                              <span key={skill} className="break-words rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                {skill}
                              </span>
                            ))
                          ) : "Select skills"}
                        </span>
                        <span className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          {skillsOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                        </span>
                      </button>

                      {skillsOpen && (
                        <div className="absolute z-10 mt-2 w-full rounded-xl border border-indigo-100 bg-white p-2 shadow-xl shadow-slate-200/70">
                          <div className="relative">
                            <Search
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                              autoFocus
                              value={skillSearch}
                              onChange={(event) => setSkillSearch(event.target.value)}
                              placeholder="Search skills..."
                              className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
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
                  <label className="mb-1.5 block text-sm font-medium">
                    Notes
                  </label>
                  <textarea
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

              {message && (
                <p role="alert" className="text-sm text-red-600">
                  {message}
                </p>
              )}

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
                  className="app-button-primary"
                >
                  {saving ? "Saving and reading resume..." : editingId !== null ? "Save Changes" : "Add Resume"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resumeToDelete && (
        <div className="app-modal-backdrop !z-[80]">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-resume-title" aria-describedby="delete-resume-description" className="app-modal-panel max-w-md p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 size={22} /></div>
            <h2 id="delete-resume-title" className="mx-auto mt-4 w-fit rounded-lg bg-red-50 px-3 py-2 text-lg font-bold text-red-800">Delete resume?</h2>
            <p id="delete-resume-description" className="mt-2 text-sm text-gray-500">Delete &quot;{resumeToDelete.name}&quot; from your resume library?</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => setResumeToDelete(null)} className="app-button-secondary">Cancel</button>
              <button type="button" onClick={confirmDeleteResume} className="app-button-danger">Delete resume</button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
