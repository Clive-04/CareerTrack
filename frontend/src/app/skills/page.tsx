"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Database,
  Wrench,
  Users,
  Layers,
} from "lucide-react";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import PageHeader from "@/components/PageHeader";
import {
  useSkills,
  type Proficiency,
  type Skill,
  type SkillCategory,
} from "@/components/SkillsProvider";
import useDialogControls from "@/hooks/useDialogControls";
import ExpandableText from "@/components/ExpandableText";
import MetricCard from "@/components/MetricCard";

const categories: SkillCategory[] = [
  "Programming",
  "Frameworks",
  "Databases",
  "Tools",
  "Soft Skills",
  "Other",
];

const proficiencyLevels: Proficiency[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];

const emptyForm = {
  name: "",
  category: "Programming" as SkillCategory,
  proficiency: "Beginner" as Proficiency,
  yearsExperience: "0",
  notes: "",
};

export default function SkillsPage() {
  const { skills, createSkill, updateSkill, deleteSkill: removeSkill, isLoading, error: skillsError } = useSkills();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [proficiencyFilter, setProficiencyFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);

  useDialogControls(showModal, () => setShowModal(false));
  useDialogControls(skillToDelete !== null, () => setSkillToDelete(null));

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const searchText =
        `${skill.name} ${skill.category} ${skill.notes}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "All" || skill.category === categoryFilter;
      const matchesProficiency =
        proficiencyFilter === "All" ||
        skill.proficiency === proficiencyFilter;

      return matchesSearch && matchesCategory && matchesProficiency;
    });
  }, [skills, search, categoryFilter, proficiencyFilter]);

  const categoryCount = new Set(skills.map((skill) => skill.category)).size;

  const advancedCount = skills.filter(
    (skill) =>
      skill.proficiency === "Advanced" || skill.proficiency === "Expert"
  ).length;

  const averageExperience =
    skills.length > 0
      ? (
          skills.reduce((total, skill) => total + skill.yearsExperience, 0) /
          skills.length
        ).toFixed(1)
      : "0.0";

  function openAddModal() {
    setError("");
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(skill: Skill) {
    setError("");
    setEditingId(skill.id);
    setForm({
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
      yearsExperience: String(skill.yearsExperience),
      notes: skill.notes,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError("Skill name is required and cannot contain only spaces.");
      return;
    }

    const years = Number(form.yearsExperience);

    if (
      !form.yearsExperience.trim() ||
      !Number.isFinite(years) ||
      years < 0 ||
      years > 60
    ) {
      setError("Years of experience must be between 0 and 60.");
      return;
    }

    const skillData = {
      name,
      category: form.category,
      proficiency: form.proficiency,
      yearsExperience: years,
      notes: form.notes.trim(),
    };

    try {
      if (editingId !== null) await updateSkill(editingId, skillData);
      else await createSkill(skillData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save skill.");
      return;
    }

    setError("");
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function confirmDeleteSkill() { if (!skillToDelete) return; try { await removeSkill(skillToDelete.id); setSkillToDelete(null); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to delete skill."); } }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  function getCategoryIcon(category: SkillCategory) {
    switch (category) {
      case "Programming":
        return Code2;
      case "Frameworks":
        return Layers;
      case "Databases":
        return Database;
      case "Tools":
        return Wrench;
      case "Soft Skills":
        return Users;
      default:
        return Award;
    }
  }

  function getProficiencyColor(proficiency: Proficiency) {
    switch (proficiency) {
      case "Beginner":
        return "bg-slate-400";
      case "Intermediate":
        return "bg-blue-500";
      case "Advanced":
        return "bg-indigo-500";
      case "Expert":
        return "bg-emerald-500";
    }
  }

  function getProficiencyLevel(proficiency: Proficiency) {
    switch (proficiency) {
      case "Beginner":
        return 1;
      case "Intermediate":
        return 2;
      case "Advanced":
        return 3;
      case "Expert":
        return 4;
    }
  }

  return (
    <WorkspaceLayout>
      <div className="px-5 pt-6 sm:px-8 sm:pt-8">
        <PageHeader
          eyebrow="Your capabilities"
          title="Skills"
          description="Organize your skills and track your proficiency."
          action={
            <button
              type="button"
              onClick={openAddModal}
              className="app-button-primary self-start"
            >
              <Plus size={18} />
              Add Skill
            </button>
          }
        />
        {isLoading && <div role="status" className="app-loading-state"><span className="app-spinner" aria-hidden="true" />Loading skills...</div>}
        {skillsError && <p role="alert" className="app-notice-error mt-4">{skillsError}</p>}
      </div>

      <div className="space-y-6 p-5 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Skills",
              value: skills.length,
              icon: Award,
              tone: "indigo" as const,
            },
            {
              label: "Categories",
              value: categoryCount,
              icon: Layers,
              tone: "blue" as const,
            },
            {
              label: "Advanced / Expert",
              value: advancedCount,
              icon: CheckCircle2,
              tone: "emerald" as const,
            },
            {
              label: "Avg. Experience",
              value: `${averageExperience} yrs`,
              icon: BriefcaseBusiness,
              tone: "amber" as const,
            },
          ].map((card) => {
            const Icon = card.icon;

            return (
              <MetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={Icon}
                tone={card.tone}
              />
            );
          })}
        </div>

        <section className="app-surface overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">My Skills</h2>
              <p className="mt-1 text-sm text-gray-500">
                Track the skills you can use in your job applications.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <label className="app-search-control relative flex items-center rounded-xl border border-slate-200 bg-white">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  aria-label="Search skills"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full rounded-xl bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none sm:w-52"
                />
              </label>

              <select
                aria-label="Filter skills by category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="All">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter skills by proficiency"
                value={proficiencyFilter}
                onChange={(e) => setProficiencyFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="All">All proficiency levels</option>
                {proficiencyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredSkills.length === 0 ? (
              <div className="app-empty-state md:col-span-2 xl:col-span-3">
                <Award size={36} className="mx-auto text-gray-300" />
                <p className="mt-3 font-medium text-gray-700">
                  No skills found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Try another search or add a new skill.
                </p>
              </div>
            ) : (
              filteredSkills.map((skill) => {
                const Icon = getCategoryIcon(skill.category);
                const proficiencyLevel = getProficiencyLevel(skill.proficiency);

                return (
                  <article
                    key={skill.id}
                    className="app-data-card flex h-full flex-col !p-5"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <Icon size={21} strokeWidth={1.9} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold tracking-[-0.015em] text-slate-900" title={skill.name}>
                          {skill.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">{skill.category}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 pt-1 text-xs font-medium text-slate-600">
                        <span className={`h-2 w-2 rounded-full ${getProficiencyColor(skill.proficiency)}`} />
                        {skill.proficiency}
                      </div>
                    </div>

                    <div className="mt-5 border-y border-slate-100 py-4">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-500">Experience</span>
                        <span className="font-semibold text-slate-800">
                          {skill.yearsExperience} {skill.yearsExperience === 1 ? "year" : "years"}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Proficiency</span>
                          <span className="text-slate-400">Level {proficiencyLevel} of 4</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-label={`${skill.proficiency} proficiency, level ${proficiencyLevel} of 4`}>
                          <div className="h-full rounded-full bg-indigo-500 transition-[width] duration-300" style={{ width: `${proficiencyLevel * 25}%` }} />
                        </div>
                      </div>
                    </div>

                    {skill.notes && (
                      <div className="mt-4">
                        <p className="mb-1.5 text-xs font-medium text-slate-400">Notes</p>
                        <ExpandableText text={skill.notes} className="text-sm leading-6 text-slate-600" />
                      </div>
                    )}

                    <div className="app-card-actions !mt-auto">
                      <button
                        type="button"
                        onClick={() => openEditModal(skill)}
                        className="app-button-secondary flex-1"
                      >
                        <Pencil size={15} />
                        Edit skill
                      </button>

                      <button
                        type="button"
                        onClick={() => setSkillToDelete(skill)}
                        aria-label={`Delete ${skill.name}`}
                        title="Delete skill"
                        className="app-icon-button hover:!border-red-200 hover:!bg-red-50 hover:!text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="app-results-footer flex flex-wrap items-center justify-between gap-3">
            <span>Showing {filteredSkills.length} of {skills.length} skills</span>
            {(search || categoryFilter !== "All" || proficiencyFilter !== "All") && (
              <button type="button" onClick={() => { setSearch(""); setCategoryFilter("All"); setProficiencyFilter("All"); }} className="app-button-text">
                Clear filters
              </button>
            )}
          </div>
        </section>
      </div>

      {showModal && (
        <div className="app-modal-backdrop app-modal-backdrop-scroll">
          <div role="dialog" aria-modal="true" aria-labelledby="skill-form-title" className="app-modal-panel my-auto max-w-xl">
            <div className={`flex items-center justify-between border-b px-6 py-5 ${editingId !== null ? "border-amber-200 bg-amber-50/70" : "border-indigo-200 bg-indigo-50/70"}`}>
              <div>
                <h2 id="skill-form-title" className={`text-lg font-bold ${editingId !== null ? "text-amber-950" : "text-indigo-950"}`}>
                  {editingId !== null ? "Edit Skill" : "Add Skill"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Enter your skill and experience details.
                </p>
              </div>

              <button
                type="button"
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
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Skill Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g. JavaScript"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as SkillCategory,
                      })
                    }
                    className={inputClass}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Proficiency *
                  </label>
                  <select
                    value={form.proficiency}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        proficiency: e.target.value as Proficiency,
                      })
                    }
                    className={inputClass}
                  >
                    {proficiencyLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">
                    Years of Experience *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    max="60"
                    step="0.5"
                    value={form.yearsExperience}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        yearsExperience: e.target.value,
                      })
                    }
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
                    placeholder="Describe how you have used this skill..."
                    className={inputClass}
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="app-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="app-button-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="app-button-primary"
                >
                  {editingId !== null ? "Save Changes" : "Add Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {skillToDelete && (
        <div className="app-modal-backdrop !z-[80]">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-skill-title" aria-describedby="delete-skill-description" className="app-modal-panel max-w-md p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 size={22} /></div>
            <h2 id="delete-skill-title" className="mx-auto mt-4 w-fit rounded-lg bg-red-50 px-3 py-2 text-lg font-bold text-red-800">Delete skill?</h2>
            <p id="delete-skill-description" className="mt-2 text-sm text-gray-500">Delete &quot;{skillToDelete.name}&quot; from your skills?</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => setSkillToDelete(null)} className="app-button-secondary">Cancel</button>
              <button type="button" onClick={confirmDeleteSkill} className="app-button-danger">Delete skill</button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
