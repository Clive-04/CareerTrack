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
  CheckCircle2,
  Star,
  Upload,
} from "lucide-react";

type Resume = {
  id: number;
  name: string;
  targetRole: string;
  fileName: string;
  updatedAt: string;
  skills: string[];
  isDefault: boolean;
  notes: string;
};

const initialResumes: Resume[] = [
  {
    id: 1,
    name: "Software Developer Resume",
    targetRole: "Junior Software Engineer",
    fileName: "clive_software_developer.pdf",
    updatedAt: "2026-10-09",
    skills: ["Python", "FastAPI", "SQL", "Git"],
    isDefault: true,
    notes: "Main resume for software development roles.",
  },
  {
    id: 2,
    name: "Frontend Developer Resume",
    targetRole: "Frontend Developer",
    fileName: "clive_frontend_resume.pdf",
    updatedAt: "2026-10-05",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    isDefault: false,
    notes: "Emphasizes frontend projects and UI development.",
  },
  {
    id: 3,
    name: "IT Support Resume",
    targetRole: "IT Support Associate",
    fileName: "clive_it_support.pdf",
    updatedAt: "2026-09-28",
    skills: ["Troubleshooting", "Networking", "Windows"],
    isDefault: false,
    notes: "Focuses on technical support and networking.",
  },
];

const emptyForm = {
  name: "",
  targetRole: "",
  fileName: "",
  skills: "",
  notes: "",
};

function formatDate(date: string) {
  if (!date) return "Not set";

  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>(initialResumes);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const roles = useMemo(() => {
    return Array.from(
      new Set(resumes.map((resume) => resume.targetRole).filter(Boolean))
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
    setShowModal(true);
  }

  function openEditModal(resume: Resume) {
    setEditingId(resume.id);
    setForm({
      name: resume.name,
      targetRole: resume.targetRole,
      fileName: resume.fileName,
      skills: resume.skills.join(", "),
      notes: resume.notes,
    });
    setSelectedFile(null);
    setMessage("");
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fileName = selectedFile
      ? selectedFile.name
      : form.fileName.trim();

    const skills = form.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (editingId !== null) {
      setResumes((current) =>
        current.map((resume) =>
          resume.id === editingId
            ? {
                ...resume,
                name: form.name.trim(),
                targetRole: form.targetRole.trim(),
                fileName,
                skills,
                notes: form.notes.trim(),
                updatedAt: new Date().toLocaleDateString("en-CA"),
              }
            : resume
        )
      );
    } else {
      if (!selectedFile) {
        setMessage("Please select a resume file before adding it.");
        return;
      }

      const newResume: Resume = {
        id: Date.now(),
        name: form.name.trim(),
        targetRole: form.targetRole.trim(),
        fileName: selectedFile.name,
        updatedAt: new Date().toLocaleDateString("en-CA"),
        skills,
        isDefault: resumes.length === 0,
        notes: form.notes.trim(),
      };

      setResumes((current) => [...current, newResume]);
    }

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setMessage("");
  }

  function setAsDefault(id: number) {
    setResumes((current) =>
      current.map((resume) => ({
        ...resume,
        isDefault: resume.id === id,
      }))
    );
  }

  function deleteResume(id: number) {
    const resume = resumes.find((item) => item.id === id);

    if (!resume) return;

    if (
      window.confirm(
        `Delete "${resume.name}" from your resume library?`
      )
    ) {
      setResumes((current) => {
        const remaining = current.filter((item) => item.id !== id);

        if (resume.isDefault && remaining.length > 0) {
          remaining[0] = { ...remaining[0], isDefault: true };
        }

        return remaining;
      });
    }
  }

  function downloadResumeInfo(resume: Resume) {
    const content = [
      `Resume: ${resume.name}`,
      `Target Role: ${resume.targetRole}`,
      `File: ${resume.fileName}`,
      `Last Updated: ${resume.updatedAt}`,
      `Skills: ${resume.skills.join(", ")}`,
      `Notes: ${resume.notes}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${resume.name.replace(/[^a-z0-9]/gi, "_")}_details.txt`;
    link.click();

    URL.revokeObjectURL(url);
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-gray-800">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col bg-[#172B4D] text-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
            <BriefcaseBusiness size={22} />
          </div>
          <span className="text-xl font-bold tracking-tight">
            CareerTrack
          </span>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-blue-200/60">
            Workspace
          </p>

          {[
            { name: "Dashboard", href: "/", icon: BriefcaseBusiness },
            { name: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
            { name: "Applications", href: "/applications", icon: CheckCircle2 },
            { name: "Interviews", href: "/interviews", icon: CalendarDays },
            { name: "Resumes", href: "/resumes", icon: FileText },
            { name: "Skills", href: "/skills", icon: CheckCircle2 },
          ].map((item) => {
            const Icon = item.icon;
            const active = item.name === "Resumes";

            return (
              <a
                key={item.name}
                href={item.href}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-blue-500 text-white"
                    : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={19} />
                {item.name}
              </a>
            );
          })}
        </div>

        <div className="mt-auto border-t border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-400 font-semibold">
              CB
            </div>
            <div>
              <p className="text-sm font-semibold">Clive Benito</p>
              <p className="text-xs text-blue-200/70">Job Seeker</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="flex flex-col gap-4 border-b border-gray-200 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm text-gray-500">Workspace / Resumes</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Resumes
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your resume versions for different job opportunities.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Resume
          </button>
        </header>

        <div className="space-y-6 p-5 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          </div>

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
                  <FileText
                    size={36}
                    className="mx-auto text-gray-300"
                  />
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
                      <FileText size={18} className="shrink-0 text-gray-400" />
                      <span className="truncate text-xs text-gray-600">
                        {resume.fileName}
                      </span>
                    </div>

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
                        onClick={() => openEditModal(resume)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        onClick={() => downloadResumeInfo(resume)}
                        title="Download resume details"
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
                      >
                        <Download size={17} />
                      </button>

                      <button
                        onClick={() => setAsDefault(resume.id)}
                        disabled={resume.isDefault}
                        title="Set as default resume"
                        className="rounded-lg border border-gray-200 p-2 text-amber-600 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Star size={17} />
                      </button>

                      <button
                        onClick={() => deleteResume(resume.id)}
                        title="Delete resume"
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
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4">
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
                onClick={() => setShowModal(false)}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
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
                    Resume File *
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
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      required={editingId === null}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;

                        if (file && file.size > 10 * 1024 * 1024) {
                          setMessage("The file must be 10 MB or smaller.");
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
                    Maximum file size: 10 MB. Files are not uploaded to a server yet.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">
                    Skills
                  </label>
                  <input
                    value={form.skills}
                    onChange={(e) =>
                      setForm({ ...form, skills: e.target.value })
                    }
                    placeholder="Separate skills with commas, e.g. Python, SQL, Git"
                    className={inputClass}
                  />
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
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editingId !== null ? "Save Changes" : "Add Resume"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}