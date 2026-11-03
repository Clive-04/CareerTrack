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
        return "bg-gray-100 text-gray-700";
      case "Intermediate":
        return "bg-blue-50 text-blue-700";
      case "Advanced":
        return "bg-purple-50 text-purple-700";
      case "Expert":
        return "bg-green-50 text-green-700";
    }
  }

  function getProficiencyWidth(proficiency: Proficiency) {
    switch (proficiency) {
      case "Beginner":
        return "25%";
      case "Intermediate":
        return "50%";
      case "Advanced":
        return "75%";
      case "Expert":
        return "100%";
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
              onClick={openAddModal}
              className="app-button-primary self-start"
            >
              <Plus size={18} />
              Add Skill
            </button>
          }
        />
        {isLoading && <div role="status" className="app-loading-state"><span className="app-spinner" aria-hidden="true" />Loading skills...</div>}
        {skillsError && <p role="alert" className="text-sm text-red-600">{skillsError}</p>}
      </div>

      <div className="space-y-6 p-5 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Skills",
              value: skills.length,
              icon: Award,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Categories",
              value: categoryCount,
              icon: Layers,
              color: "bg-purple-50 text-purple-600",
            },
            {
              label: "Advanced / Expert",
              value: advancedCount,
              icon: CheckCircle2,
              color: "bg-green-50 text-green-600",
            },
            {
              label: "Avg. Experience",
              value: `${averageExperience} yrs`,
              icon: BriefcaseBusiness,
              color: "bg-amber-50 text-amber-600",
            },
          ].map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="app-surface app-surface-interactive p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
                  >
                    <Icon size={20} />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
              </div>
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
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  aria-label="Search skills"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 sm:w-52"
                />
              </div>

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

                return (
                  <article
                    key={skill.id}
                    className="rounded-xl border border-gray-200 p-5 transition hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon size={22} />
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getProficiencyColor(skill.proficiency)}`}
                      >
                        {skill.proficiency}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-gray-900">
                      {skill.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {skill.category}
                    </p>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                        <span>Proficiency</span>
                        <span>{getProficiencyWidth(skill.proficiency)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{
                            width: getProficiencyWidth(skill.proficiency),
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-gray-500">Experience</span>
                      <span className="font-medium text-gray-700">
                        {skill.yearsExperience}{" "}
                        {skill.yearsExperience === 1 ? "year" : "years"}
                      </span>
                    </div>

                    {skill.notes && (
                      <p className="mt-3 line-clamp-2 text-sm text-gray-500">
                        {skill.notes}
                      </p>
                    )}

                    <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => openEditModal(skill)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        onClick={() => setSkillToDelete(skill)}
                        aria-label={`Delete ${skill.name}`}
                        className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-500">
            Showing {filteredSkills.length} of {skills.length} skills
          </div>
        </section>
      </div>

      {showModal && (
        <div className="app-modal-backdrop app-modal-backdrop-scroll">
          <div role="dialog" aria-modal="true" aria-labelledby="skill-form-title" className="app-modal-panel my-auto max-w-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 id="skill-form-title" className="text-lg font-bold text-gray-900">
                  {editingId !== null ? "Edit Skill" : "Add Skill"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter your skill and experience details.
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

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
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
            <h2 id="delete-skill-title" className="mt-4 text-lg font-bold text-gray-900">Delete skill?</h2>
            <p id="delete-skill-description" className="mt-2 text-sm text-gray-500">Delete &quot;{skillToDelete.name}&quot; from your skills?</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => setSkillToDelete(null)} className="app-button-secondary">Cancel</button>
              <button type="button" onClick={confirmDeleteSkill} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Delete skill</button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
