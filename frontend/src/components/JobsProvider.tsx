"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  createJob as createJobRequest,
  deleteJob as deleteJobRequest,
  getJobs,
  updateJob as updateJobRequest,
  type ApiJob,
} from "@/lib/api";

export type Job = {
  id: string;
  company: string;
  position: string;
  location: string;
  employmentType: string;
  salary: string;
  dateAdded: string;
  description: string;
  latestAnalysisScore: number | null;
  latestAnalysisResumeId: string | null;
  latestAnalysisCreatedAt: string | null;
  latestAnalysisIsStale: boolean;
  latestAnalysisStaleReasons: string[];
};

export type JobInput = {
  company: string;
  position: string;
  location: string;
  employmentType: string;
  salary: string;
  description: string;
};

type JobsContextValue = {
  jobs: Job[];
  isLoading: boolean;
  error: string;
  createJob: (input: JobInput) => Promise<void>;
  updateJob: (id: string, input: JobInput) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  refreshJobs: () => Promise<void>;
};

const JobsContext = createContext<JobsContextValue | null>(null);

function formatSalary(salaryMin: number | null, salaryMax: number | null) {
  if (salaryMin === null && salaryMax === null) return "Not specified";

  const formatAmount = (amount: number) =>
    `₱${amount.toLocaleString("en-US")}`;

  if (salaryMin !== null && salaryMax !== null) {
    return `${formatAmount(salaryMin)}–${formatAmount(salaryMax)} / month`;
  }

  return formatAmount(salaryMin ?? salaryMax ?? 0);
}

function mapApiJob(job: ApiJob): Job {
  return {
    id: job.id,
    company: job.company,
    position: job.position,
    location: job.location ?? "Not specified",
    employmentType: job.employment_type ?? "Not specified",
    salary: formatSalary(job.salary_min, job.salary_max),
    dateAdded: new Date(job.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    description: job.description ?? "No description provided.",
    latestAnalysisScore: job.latest_analysis_score ?? null,
    latestAnalysisResumeId: job.latest_analysis_resume_id ?? null,
    latestAnalysisCreatedAt: job.latest_analysis_created_at ?? null,
    latestAnalysisIsStale: job.latest_analysis_is_stale ?? false,
    latestAnalysisStaleReasons: job.latest_analysis_stale_reasons ?? [],
  };
}

function getSalaryValues(salary: string) {
  const values =
    salary.match(/\d[\d,]*/g)?.map((value) =>
      Number(value.replace(/,/g, "")),
    ) ?? [];

  return {
    salary_min: values[0] ?? null,
    salary_max: values[1] ?? null,
  };
}

function toApiJob(input: JobInput) {
  return {
    company: input.company,
    position: input.position,
    location: input.location === "Not specified" ? null : input.location,
    employment_type:
      input.employmentType === "Not specified" ? null : input.employmentType,
    description:
      input.description === "No description provided."
        ? null
        : input.description,
    ...getSalaryValues(input.salary),
  };
}

export default function JobsProvider({ children }: { children: ReactNode }) {
  const { token, isLoading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshJobs = useCallback(async () => {
    if (!token) return;
    try {
      const response = await getJobs(token);
      setJobs(response.map(mapApiJob));
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load jobs.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      return;
    }

    getJobs(token)
      .then((response) => {
        setJobs(response.map(mapApiJob));
        setError("");
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Unable to load jobs.");
      })
      .finally(() => setIsLoading(false));
  }, [authLoading, refreshJobs, token]);

  async function createJob(input: JobInput) {
    if (!token) throw new Error("You must be signed in to create a job.");
    const response = await createJobRequest(token, toApiJob(input));
    setJobs((current) => [mapApiJob(response), ...current]);
  }

  async function updateJob(id: string, input: JobInput) {
    if (!token) throw new Error("You must be signed in to update a job.");
    const response = await updateJobRequest(token, id, toApiJob(input));
    setJobs((current) =>
      current.map((job) => (job.id === id ? mapApiJob(response) : job)),
    );
  }

  async function deleteJob(id: string) {
    if (!token) throw new Error("You must be signed in to delete a job.");
    await deleteJobRequest(token, id);
    setJobs((current) => current.filter((job) => job.id !== id));
  }

  return (
    <JobsContext.Provider
      value={{ jobs, isLoading, error, createJob, updateJob, deleteJob, refreshJobs }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (context === null) {
    throw new Error("useJobs must be used inside JobsProvider.");
  }
  return context;
}
