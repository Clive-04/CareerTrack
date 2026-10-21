"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type ApplicationStatus =
  | "Applied"
  | "In Review"
  | "Interview"
  | "Offer"
  | "Rejected";

export type Application = {
  id: number;
  company: string;
  position: string;
  location: string;
  dateApplied: string;
  status: ApplicationStatus;
  notes: string;
};

const initialApplications: Application[] = [
  {
    id: 1,
    company: "Google",
    position: "Junior Software Engineer",
    location: "Makati, Philippines",
    dateApplied: "2026-10-09",
    status: "Applied",
    notes: "Submitted application through the company website.",
  },
  {
    id: 2,
    company: "Microsoft",
    position: "Frontend Developer",
    location: "Remote",
    dateApplied: "2026-10-07",
    status: "Interview",
    notes: "Prepare for the technical interview.",
  },
  {
    id: 3,
    company: "Accenture",
    position: "Associate Software Engineer",
    location: "Taguig, Philippines",
    dateApplied: "2026-10-05",
    status: "In Review",
    notes: "Waiting for an update from recruitment.",
  },
  {
    id: 4,
    company: "Canva",
    position: "UI Developer Intern",
    location: "Remote",
    dateApplied: "2026-10-03",
    status: "Rejected",
    notes: "Application closed.",
  },
];

type ApplicationsContextValue = {
  applications: Application[];
  setApplications: Dispatch<SetStateAction<Application[]>>;
};

const ApplicationsContext =
  createContext<ApplicationsContextValue | null>(null);

export default function ApplicationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [applications, setApplications] =
    useState<Application[]>(initialApplications);

  return (
    <ApplicationsContext.Provider
      value={{ applications, setApplications }}
    >
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationsContext);

  if (context === null) {
    throw new Error(
      "useApplications must be used inside ApplicationsProvider.",
    );
  }

  return context;
}