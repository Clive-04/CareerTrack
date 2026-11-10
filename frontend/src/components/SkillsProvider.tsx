"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSkill as createRequest, deleteSkill as deleteRequest, getSkills, updateSkill as updateRequest, type ApiSkill } from "@/lib/api";
export type Proficiency = "Beginner" | "Intermediate" | "Advanced" | "Expert";
export type SkillCategory = "Programming" | "Frameworks" | "Databases" | "Tools" | "Soft Skills" | "Other";
export type Skill = { id: string; name: string; category: SkillCategory; proficiency: Proficiency; yearsExperience: number; notes: string };
type ContextValue = { skills: Skill[]; isLoading: boolean; error: string; createSkill: (input: Omit<Skill, "id">) => Promise<void>; updateSkill: (id: string, input: Omit<Skill, "id">) => Promise<void>; deleteSkill: (id: string) => Promise<void> };
const Context = createContext<ContextValue | null>(null);
function mapSkill(item: ApiSkill): Skill { return { id: item.id, name: item.name, category: item.category as SkillCategory, proficiency: item.proficiency as Proficiency, yearsExperience: item.years_experience, notes: item.notes }; }
function payload(input: Omit<Skill, "id">) { return { name: input.name, category: input.category, proficiency: input.proficiency, years_experience: input.yearsExperience, notes: input.notes }; }
export default function SkillsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  return <AccountSkillsProvider key={token ?? "signed-out"}>{children}</AccountSkillsProvider>;
}

function AccountSkillsProvider({ children }: { children: ReactNode }) {
  const { token, isLoading: authLoading } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isLoading = authLoading || (!!token && loading);
  useEffect(() => {
    if (authLoading || !token) return;
    let active = true;
    getSkills(token)
      .then((items) => { if (active) { setSkills(items.map(mapSkill)); setError(""); } })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load skills."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, token]);
  async function createSkill(input: Omit<Skill, "id">) { if (!token) throw new Error("You must be signed in to create a skill."); const response = await createRequest(token, payload(input)); setSkills((current) => [...current, mapSkill(response)]); }
  async function updateSkill(id: string, input: Omit<Skill, "id">) { if (!token) throw new Error("You must be signed in to update a skill."); const response = await updateRequest(token, id, payload(input)); setSkills((current) => current.map((item) => item.id === id ? mapSkill(response) : item)); }
  async function deleteSkill(id: string) { if (!token) throw new Error("You must be signed in to delete a skill."); await deleteRequest(token, id); setSkills((current) => current.filter((item) => item.id !== id)); }
  return <Context.Provider value={{ skills, isLoading, error, createSkill, updateSkill, deleteSkill }}>{children}</Context.Provider>;
}
export function useSkills() { const context = useContext(Context); if (!context) throw new Error("useSkills must be used inside SkillsProvider."); return context; }
