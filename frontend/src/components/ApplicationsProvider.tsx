"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import { useJobs } from "@/components/JobsProvider";
import { useResumes } from "@/components/ResumesProvider";
import {
  createApplication as createApplicationRequest,
  deleteApplication as deleteApplicationRequest,
  getApplications,
  updateApplication as updateApplicationRequest,
  type ApiApplication,
} from "@/lib/api";

export type ApplicationStatus =
  | "Applied"
  | "In Review"
  | "Interview"
  | "Offer"
  | "Rejected";

export type Application = {
  id: string;
  jobId: string;
  company: string;
  position: string;
  location: string;
  dateApplied: string;
  status: ApplicationStatus;
  notes: string;
  resumeId: string;
  resumeName: string;
};

export type ApplicationInput = {
  jobId: string;
  dateApplied: string;
  status: ApplicationStatus;
  notes: string;
  resumeId: string;
};

type ApplicationsContextValue = {
  applications: Application[];
  isLoading: boolean;
  error: string;
  createApplication: (input: ApplicationInput) => Promise<void>;
  updateApplication: (id: string, input: ApplicationInput) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
};

const ApplicationsContext =
  createContext<ApplicationsContextValue | null>(null);

const backendStatusByFrontendStatus: Record<ApplicationStatus, string> = {
  Applied: "APPLIED",
  "In Review": "ASSESSMENT",
  Interview: "INTERVIEW",
  Offer: "OFFER",
  Rejected: "REJECTED",
};

const frontendStatusByBackendStatus: Record<string, ApplicationStatus> = {
  SAVED: "Applied",
  APPLIED: "Applied",
  ASSESSMENT: "In Review",
  INTERVIEW: "Interview",
  FINAL_INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Rejected",
};

function mapApplication(
  application: ApiApplication,
  jobs: ReturnType<typeof useJobs>["jobs"],
  resumes: ReturnType<typeof useResumes>["resumes"],
): Application {
  const job = jobs.find((item) => item.id === application.job_id);
  const resume = resumes.find((item) => item.id === application.resume_id);

  return {
    id: application.id,
    jobId: application.job_id,
    company: job?.company ?? "Unknown company",
    position: job?.position ?? "Unknown position",
    location: job?.location ?? "Not specified",
    dateApplied: application.date_applied ?? "",
    status: frontendStatusByBackendStatus[application.status] ?? "Applied",
    notes: application.notes ?? "",
    resumeId: application.resume_id ?? "",
    resumeName: resume?.name ?? (application.resume_id ? "Deleted resume" : "No resume selected"),
  };
}

function toBackendApplication(input: ApplicationInput) {
  return {
    job_id: input.jobId,
    status: backendStatusByFrontendStatus[input.status],
    date_applied: input.dateApplied || null,
    notes: input.notes || null,
    resume_id: input.resumeId || null,
  };
}

export default function ApplicationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { token, isLoading: authLoading } = useAuth();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { resumes, isLoading: resumesLoading } = useResumes();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || jobsLoading || resumesLoading) return;

    if (!token) return;

    getApplications(token)
      .then((response) => {
        setApplications(response.map((item) => mapApplication(item, jobs, resumes)));
        setError("");
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load applications.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [authLoading, jobs, jobsLoading, resumes, resumesLoading, token]);

  async function createApplication(input: ApplicationInput) {
    if (!token) throw new Error("You must be signed in to create an application.");
    const response = await createApplicationRequest(
      token,
      toBackendApplication(input),
    );
    setApplications((current) => [mapApplication(response, jobs, resumes), ...current]);
  }

  async function updateApplication(id: string, input: ApplicationInput) {
    if (!token) throw new Error("You must be signed in to update an application.");
    const response = await updateApplicationRequest(
      token,
      id,
      toBackendApplication(input),
    );
    setApplications((current) =>
      current.map((item) =>
        item.id === id ? mapApplication(response, jobs, resumes) : item,
      ),
    );
  }

  async function deleteApplication(id: string) {
    if (!token) throw new Error("You must be signed in to delete an application.");
    await deleteApplicationRequest(token, id);
    setApplications((current) => current.filter((item) => item.id !== id));
  }

  return (
    <ApplicationsContext.Provider
      value={{
        applications,
        isLoading,
        error,
        createApplication,
        updateApplication,
        deleteApplication,
      }}
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
