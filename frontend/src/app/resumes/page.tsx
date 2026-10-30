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
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { useResumes, type Resume } from "@/components/ResumesProvider";
import { useSkills } from "@/components/SkillsProvider";

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
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

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
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Resume
            </button>
          }
        />
        {message && !showModal && <p role="alert" className="text-sm text-red-600">{message}</p>}
        {isLoading && <p className="text-sm text-gray-500">Loading resumes...</p>}
        {resumesError && <p role="alert" className="text-sm text-red-600">{resumesError}</p>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Total Resumes</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText size={20} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">
              {resumes.length}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Resume versions in your library
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Target Roles</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <BriefcaseBusiness size={20} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">
              {roles.length}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Different roles covered
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Default Resume</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Star size={20} />
              </div>
            </div>
            <p className="mt-4 truncate text-lg font-bold text-gray-900">
              {defaultResume?.name ?? "Not set"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Your preferred resume version
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
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
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search resumes..."
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-56"
                />
              </div>

              <select
                aria-label="Filter resumes by target role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
              <div className="py-12 text-center md:col-span-2 xl:col-span-3">
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
                  className="flex flex-col rounded-xl border border-gray-200 p-5 transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileText size={25} />
                    </div>

                    {resume.isDefault && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <Star size={13} />
                        Default
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 font-semibold text-gray-900">
                    {resume.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {resume.targetRole}
                  </p>

                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                    <FileText
                      size={18}
                      className="shrink-0 text-gray-400"
                    />
                    <span className="truncate text-xs text-gray-600">
                      {resume.fileName}{!resume.hasFile && " (file not uploaded)"}
                    </span>
                  </div>

                  {resume.hasFile && (
                    <div className="mt-3 text-sm" aria-live="polite">
                      {resume.extractionStatus === "ready" ? (
                        <p className="text-green-700">Text extracted — ready for analysis.</p>
                      ) : (
                        <>
                          <p className="text-amber-700">
                            {resume.extractionStatus === "unavailable"
                              ? "No readable text could be extracted. The file may be scanned, password-protected, damaged, or too complex. Upload a text-based PDF or DOCX through Edit."
                              : "This file has not been checked for readable text yet."}
                          </p>
                          <button type="button" disabled={extractingId !== null} onClick={() => handleExtract(resume.id)} className="mt-2 font-medium text-blue-600 hover:underline disabled:opacity-50">
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
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.length > 0 ? (
                        resume.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">
                          No skills added
                        </span>
                      )}
                    </div>
                  </div>

                  {resume.notes && (
                    <p className="mt-4 line-clamp-2 text-sm text-gray-500">
                      {resume.notes}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
                    <CalendarDays size={14} />
                    Updated {formatDate(resume.updatedAt)}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => openEditModal(resume)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
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
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
                    >
                      <Download size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setAsDefault(resume.id)}
                      disabled={resume.isDefault}
                      title="Set as default resume"
                      aria-label={`Set ${resume.name} as default`}
                      className="rounded-lg border border-gray-200 p-2 text-amber-600 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Star size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setResumeToDelete(resume)}
                      title="Delete resume"
                      aria-label={`Delete ${resume.name}`}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-500">
            Showing {filteredResumes.length} of {resumes.length} resumes
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId !== null ? "Edit Resume" : "Add Resume"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add a resume version to your library.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setShowModal(false)}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
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
                        className="flex min-h-11 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm text-gray-700 outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                        <span className="text-gray-400">{skillsOpen ? "▲" : "▼"}</span>
                      </button>

                      {skillsOpen && (
                        <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
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
                              className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
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
                                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-blue-50"
                                  >
                                    <span>{skill.name}</span>
                                    {selected && <span className="font-semibold text-blue-600">✓</span>}
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

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {saving ? "Saving and reading resume..." : editingId !== null ? "Save Changes" : "Add Resume"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resumeToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 size={22} /></div>
            <h2 className="mt-4 text-lg font-bold text-gray-900">Delete resume?</h2>
            <p className="mt-2 text-sm text-gray-500">Delete &quot;{resumeToDelete.name}&quot; from your resume library?</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => setResumeToDelete(null)} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={confirmDeleteResume} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Delete resume</button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
