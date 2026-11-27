"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import PageHeader from "@/components/PageHeader";
import ActionMenu from "@/components/ActionMenu";
import {
  useSkills,
  type Proficiency,
  type Skill,
  type SkillCategory,
} from "@/components/SkillsProvider";
import useDialogControls from "@/hooks/useDialogControls";
import ExpandableText from "@/components/ExpandableText";

const categories: SkillCategory[] = ["Programming", "Frameworks", "Databases", "Tools", "Soft Skills", "Other"];
const proficiencyLevels: Proficiency[] = ["Beginner", "Intermediate", "Advanced", "Expert"];

const emptyForm = {
  name: "",
  category: "Programming" as SkillCategory,
  proficiency: "Beginner" as Proficiency,
  yearsExperience: "0",
  notes: "",
};

function ProficiencyMeter({ proficiency }: { proficiency: Proficiency }) {
  const level = proficiencyLevels.indexOf(proficiency) + 1;
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-700">
      <span className="flex gap-0.5" aria-hidden="true">
        {proficiencyLevels.map((_, index) => (
          <span key={index} className={`h-2.5 w-4 rounded-[2px] ${index < level ? "bg-cyan-600" : "bg-slate-200"}`} />
        ))}
      </span>
      {proficiency}
    </span>
  );
}

export default function SkillsPage() {
  const { skills, createSkill, updateSkill, deleteSkill: removeSkill, isLoading, error: skillsError } = useSkills();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [proficiencyFilter, setProficiencyFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);

  useDialogControls(showModal && !saving, () => setShowModal(false));
  useDialogControls(skillToDelete !== null, () => setSkillToDelete(null));

  const filteredSkills = useMemo(
    () =>
      skills
        .filter((skill) => {
          const text = `${skill.name} ${skill.category} ${skill.notes}`.toLowerCase();
          return (
            text.includes(search.toLowerCase()) &&
            (categoryFilter === "All" || skill.category === categoryFilter) &&
            (proficiencyFilter === "All" || skill.proficiency === proficiencyFilter)
          );
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [skills, search, categoryFilter, proficiencyFilter],
  );

  const groups = categories
    .map((category) => ({ category, items: filteredSkills.filter((skill) => skill.category === category) }))
    .filter((group) => group.items.length > 0);
  const filtersActive = search !== "" || categoryFilter !== "All" || proficiencyFilter !== "All";

  function clearFilters() {
    setSearch("");
    setCategoryFilter("All");
    setProficiencyFilter("All");
  }

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();

    if (!name) {
      setError("Enter a skill name.");
      return;
    }

    // The database stores whole years, so fractional values are rejected rather than silently rounded.
    const years = Number(form.yearsExperience);
    if (!form.yearsExperience.trim() || !Number.isInteger(years) || years < 0 || years > 60) {
      setError("Enter whole years of experience from 0 to 60.");
      return;
    }

    const skillData = { name, category: form.category, proficiency: form.proficiency, yearsExperience: years, notes: form.notes.trim() };

    setSaving(true);
    try {
      if (editingId !== null) await updateSkill(editingId, skillData);
      else await createSkill(skillData);
      setNotice(editingId !== null ? `Saved changes to ${name}.` : `Added ${name}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The skill could not be saved. Try again.");
      return;
    } finally {
      setSaving(false);
    }

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function confirmDeleteSkill() {
    if (!skillToDelete) return;
    try {
      await removeSkill(skillToDelete.id);
      setNotice(`Deleted ${skillToDelete.name}.`);
    } catch (requestError) {
      setPageError(requestError instanceof Error ? requestError.message : "The skill could not be deleted. Try again.");
    }
    setSkillToDelete(null);
  }

  return (
    <WorkspaceLayout>
      <div className="app-page space-y-6">
        <PageHeader
          title="Skills"
          description="What you can do, and how well. Resumes and analyses draw on this list."
          action={
            <button type="button" onClick={openAddModal} className="app-button-primary">
              <Plus size={18} aria-hidden="true" />
              Add skill
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
        {isLoading && skills.length === 0 && (
          <div role="status" className="app-loading-state"><span className="app-spinner" aria-hidden="true" />Loading skills…</div>
        )}
        {skillsError && <p role="alert" className="app-notice-error">{skillsError}</p>}
        {pageError && <p role="alert" className="app-notice-error">{pageError}</p>}

        {!isLoading && skills.length === 0 && !skillsError && (
          <div className="app-empty-state">
            <h2 className="app-section-title">No skills yet</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-slate-500">
              List the languages, tools, and strengths you bring. You can then attach them to each resume.
            </p>
            <button type="button" onClick={openAddModal} className="app-button-secondary mt-5">
              <Plus size={17} aria-hidden="true" />Add your first skill
            </button>
          </div>
        )}

        {skills.length > 0 && (
          <>
            <section aria-label="Filter skills" className="flex flex-col gap-3 md:flex-row md:items-center">
              <label className="app-search-control flex flex-1 items-center gap-2 border px-3">
                <Search size={17} className="text-slate-500" aria-hidden="true" />
                <input
                  aria-label="Search skills"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search skills or notes"
                  className="h-11 w-full min-w-0 bg-transparent text-[0.9375rem] outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-3 md:flex">
                <select aria-label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="form-input md:w-44">
                  <option value="All">All categories</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <select aria-label="Proficiency" value={proficiencyFilter} onChange={(event) => setProficiencyFilter(event.target.value)} className="form-input md:w-44">
                  <option value="All">All levels</option>
                  {proficiencyLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
            </section>

            <div className="app-filter-summary !mt-0">
              <p aria-live="polite">
                Showing <span className="font-semibold text-slate-800">{filteredSkills.length}</span> of {skills.length} skills
              </p>
              {filtersActive && <button type="button" onClick={clearFilters} className="app-button-text">Clear filters</button>}
            </div>

            {groups.length === 0 && (
              <div className="app-empty-state"><p className="font-medium text-slate-800">No skills match these filters</p></div>
            )}

            {groups.map(({ category, items }) => (
              <section key={category} aria-labelledby={`category-${category}`}>
                <h2 id={`category-${category}`} className="app-section-title mb-3">
                  {category} <span className="text-base font-normal text-slate-500">({items.length})</span>
                </h2>
                <ul className="app-surface divide-y divide-slate-200">
                  {items.map((skill) => (
                    <li key={skill.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_11rem_6rem_auto] sm:items-center sm:px-6">
                      <div className="min-w-0">
                        <h3 className="truncate font-medium text-slate-900" title={skill.name}>{skill.name}</h3>
                        {skill.notes && (
                          <div className="mt-1 max-w-[72ch] text-sm text-slate-600"><ExpandableText text={skill.notes} /></div>
                        )}
                      </div>
                      <div className="col-start-1 row-start-2 flex flex-wrap items-center gap-x-4 gap-y-1 sm:contents">
                        <ProficiencyMeter proficiency={skill.proficiency} />
                        <span className="text-sm tabular-nums text-slate-600">
                          {skill.yearsExperience} {skill.yearsExperience === 1 ? "year" : "years"}
                        </span>
                      </div>
                      <div className="col-start-2 row-span-2 row-start-1 sm:col-start-auto sm:row-span-1 sm:row-start-auto">
                        <ActionMenu
                          label={`More actions for ${skill.name}`}
                          items={[
                            { label: "Edit skill", icon: Pencil, onSelect: () => openEditModal(skill) },
                            "separator",
                            { label: "Delete skill", icon: Trash2, tone: "danger", onSelect: () => setSkillToDelete(skill) },
                          ]}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>

      {showModal && (
        <div className="app-modal-backdrop app-modal-backdrop-scroll">
          <div role="dialog" aria-modal="true" aria-labelledby="skill-form-title" className="app-modal-panel my-auto max-w-lg">
            <div className="app-modal-header">
              <div>
                <h2 id="skill-form-title" className="text-xl font-semibold">{editingId !== null ? "Edit skill" : "Add skill"}</h2>
                <p className="mt-1 text-sm text-slate-500">How you’d describe it on a resume.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} disabled={saving} aria-label="Close" className="app-icon-button app-icon-button-ghost">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form noValidate onSubmit={handleSubmit} className="space-y-5 p-6">
              <FormField label="Skill" required>
                <input
                  required
                  data-autofocus
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  aria-invalid={error !== "" && !form.name.trim()}
                  placeholder="TypeScript"
                  className="form-input"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Category">
                  <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as SkillCategory })} className="form-input">
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </FormField>
                <FormField label="Proficiency">
                  <select value={form.proficiency} onChange={(event) => setForm({ ...form, proficiency: event.target.value as Proficiency })} className="form-input">
                    {proficiencyLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="Years of experience" required>
                <input
                  required
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="60"
                  step="1"
                  value={form.yearsExperience}
                  onChange={(event) => setForm({ ...form, yearsExperience: event.target.value })}
                  aria-invalid={error.startsWith("Enter whole years")}
                  className="form-input sm:w-32"
                />
              </FormField>

              <FormField label="Notes">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Where you’ve used it, and what you built"
                  className="form-input resize-y"
                />
              </FormField>

              {error && <p role="alert" className="app-notice-error">{error}</p>}

              <div className="app-modal-footer">
                <button type="button" onClick={() => setShowModal(false)} disabled={saving} className="app-button-secondary">Cancel</button>
                <button type="submit" disabled={saving} aria-busy={saving} className="app-button-primary">
                  {saving && <span className="app-spinner !border-white/30 !border-t-white" aria-hidden="true" />}
                  {editingId !== null ? "Save changes" : "Add skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {skillToDelete && (
        <div className="app-modal-backdrop !z-[80]">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-skill-title" aria-describedby="delete-skill-description" className="app-modal-panel max-w-md p-6">
            <h2 id="delete-skill-title" className="text-lg font-semibold text-slate-900">Delete this skill?</h2>
            <p id="delete-skill-description" className="mt-2 text-[0.9375rem] leading-6 text-slate-600">
              “{skillToDelete.name}” will be permanently removed from your skills list. Resumes that list it keep their own copy. This can’t be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" data-autofocus onClick={() => setSkillToDelete(null)} className="app-button-secondary">Cancel</button>
              <button type="button" onClick={confirmDeleteSkill} className="app-button-danger">Delete skill</button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}

function FormField({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
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
