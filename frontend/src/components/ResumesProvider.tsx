"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { deleteResume as deleteRequest, getResumes, extractResumeText, saveResumeDocument, downloadResumeFile, type ApiResume } from "@/lib/api";

export type Resume = { id: string; extractionStatus: ApiResume["extraction_status"]; hasFile: boolean; name: string; targetRole: string; fileName: string; updatedAt: string; skills: string[]; isDefault: boolean; notes: string };
export type ResumeInput = Omit<Resume, "id" | "extractionStatus" | "hasFile" | "updatedAt" | "isDefault"> & { isDefault?: boolean; file?: File };
type ContextValue = { resumes: Resume[]; extractResume: (id: string) => Promise<void>; isLoading: boolean; error: string; createResume: (input: ResumeInput) => Promise<void>; updateResume: (id: string, input: ResumeInput) => Promise<void>; setAsDefault: (id: string) => Promise<void>; downloadResume: (resume: Resume) => Promise<void>; deleteResume: (id: string) => Promise<void> };
const ResumesContext = createContext<ContextValue | null>(null);

function mapResume(item: ApiResume): Resume { return { id: item.id, extractionStatus: item.extraction_status, hasFile: item.has_file, name: item.name, targetRole: item.target_role, fileName: item.file_name, updatedAt: item.updated_at.slice(0, 10), skills: item.skills, isDefault: item.is_default, notes: item.notes }; }
function payload(input: ResumeInput, isDefault = input.isDefault ?? false) { return { name: input.name, target_role: input.targetRole, file_name: input.fileName, skills: input.skills, notes: input.notes, is_default: isDefault }; }

export default function ResumesProvider({ children }: { children: ReactNode }) {
  const { token, isLoading: authLoading } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { if (authLoading || !token) return; getResumes(token).then((items) => { setResumes(items.map(mapResume)); setError(""); }).catch((e) => setError(e instanceof Error ? e.message : "Unable to load resumes.")).finally(() => setIsLoading(false)); }, [authLoading, token]);
  async function createResume(input: ResumeInput) { if (!token) throw new Error("You must be signed in to create a resume."); const response = await saveResumeDocument(token, null, payload(input, resumes.length === 0), input.file); setResumes((current) => [mapResume(response), ...current.map((item) => response.is_default ? { ...item, isDefault: false } : item)]); }
  async function updateResume(id: string, input: ResumeInput) { if (!token) throw new Error("You must be signed in to update a resume."); const response = await saveResumeDocument(token, id, payload(input, input.isDefault ?? resumes.find((item) => item.id === id)?.isDefault ?? false), input.file); setResumes((current) => current.map((item) => response.is_default ? (item.id === id ? mapResume(response) : { ...item, isDefault: false }) : item.id === id ? mapResume(response) : item)); }
  async function setAsDefault(id: string) { const resume = resumes.find((item) => item.id === id); if (resume) await updateResume(id, { ...resume, isDefault: true }); }
  async function deleteResume(id: string) { if (!token) throw new Error("You must be signed in to delete a resume."); await deleteRequest(token, id); setResumes((current) => current.filter((item) => item.id !== id)); }
  async function extractResume(id: string) {
    if (!token) throw new Error("You must be signed in to extract resume text.");
    const response = await extractResumeText(token, id);
    setResumes((current) => current.map((item) => item.id === id ? mapResume(response) : item));
  }
  async function downloadResume(resume: Resume) {
    if (!token) throw new Error("You must be signed in to download a resume.");
    const blob = await downloadResumeFile(token, resume.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = resume.fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <ResumesContext.Provider value={{ resumes, isLoading, error, createResume, updateResume, setAsDefault, deleteResume, downloadResume, extractResume }}>{children}</ResumesContext.Provider>;
}
export function useResumes() { const context = useContext(ResumesContext); if (!context) throw new Error("useResumes must be used inside ResumesProvider."); return context; }
