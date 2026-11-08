export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ApiUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

export type ApiJob = {
  id: string;
  company: string;
  position: string;
  location: string | null;
  employment_type: string | null;
  job_url: string | null;
  description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
  latest_analysis_score: number | null;
  latest_analysis_resume_id: string | null;
  latest_analysis_created_at: string | null;
  latest_analysis_is_stale: boolean | null;
  latest_analysis_stale_reasons: string[];
};

export type ApiApplication = {
  id: string;
  job_id: string;
  resume_id: string | null;
  status: string;
  date_applied: string | null;
  notes: string | null;
};

export type ApiInterview = {
  id: string;
  application_id: string;
  scheduled_at: string;
  type: string;
  location: string | null;
  meeting_url: string | null;
  status: string;
  notes: string | null;
};

export type ApiResume = {
  extraction_status: "ready" | "pending" | "unavailable";
  has_file: boolean;
  id: string;
  name: string;
  target_role: string;
  file_name: string;
  file_path: string;
  parsed_text: string | null;
  skills: string[];
  notes: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ApiSkill = {
  id: string;
  name: string;
  category: string;
  proficiency: string;
  years_experience: number;
  notes: string;
};

export type ResumeAnalysis = {
  id: string;
  job_id: string;
  resume_id: string | null;
  resume_name: string;
  job_title: string;
  company: string;
  model: string;
  created_at: string;
  score: number;
  summary: string;
  matches: { requirement: string; evidence: string }[];
  gaps: string[];
  suggestions: string[];
};

export type AnalysisPreview = {
  resume_text: string;
  skills_context: string;
  job_description: string;
};

export function getAnalysisHistory(token: string, jobId: string) {
  return apiRequest<ResumeAnalysis[]>(`/jobs/${jobId}/analyses`, { token });
}

export function deleteAnalysisHistory(token: string, jobId: string, id: string) {
  return apiRequest<void>(`/jobs/${jobId}/analyses/${id}`, { token, method: "DELETE" });
}

export function previewAnalysis(token: string, jobId: string, resumeId: string) {
  return apiRequest<AnalysisPreview>(`/jobs/${jobId}/analysis-preview`, {
    method: "POST", token, body: JSON.stringify({ resume_id: resumeId }),
  });
}

export function analyzeResume(token: string, jobId: string, resumeId: string, text: AnalysisPreview, consent: boolean) {
  return apiRequest<ResumeAnalysis>(`/jobs/${jobId}/analyze`, {
    method: "POST", token, body: JSON.stringify({ resume_id: resumeId, ...text, consent }),
    // Allow the backend's two-minute Gemini window plus response overhead.
    signal: AbortSignal.timeout(150000),
  });
}

type ApiRequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  { token, headers, ...options }: ApiRequestOptions = {},
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      cache: options.cache ?? "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: options.signal ?? AbortSignal.timeout(30000),
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const detail =
        typeof errorBody?.detail === "string"
          ? errorBody.detail
          : `Request failed with status ${response.status}.`;

      throw new Error(detail);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("The server took too long to respond. Check that the backend and PostgreSQL are running, then try again.");
    }
    if (error instanceof TypeError) {
      throw new Error("Unable to reach the server. Check that the backend is running and try again.");
    }
    throw error;
  }
}

export function getCurrentUser(token: string) {
  return apiRequest<ApiUser>("/auth/me", { token });
}

export function getJobs(token: string) {
  return apiRequest<ApiJob[]>("/jobs", { token });
}

export function createJob(token: string, data: Record<string, unknown>) {
  return apiRequest<ApiJob>("/jobs", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateJob(
  token: string,
  id: string,
  data: Record<string, unknown>,
) {
  return apiRequest<ApiJob>(`/jobs/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export function deleteJob(token: string, id: string) {
  return apiRequest<void>(`/jobs/${id}`, {
    method: "DELETE",
    token,
  });
}

export function getApplications(token: string) {
  return apiRequest<ApiApplication[]>("/applications", { token });
}

export function createApplication(
  token: string,
  data: Record<string, unknown>,
) {
  return apiRequest<ApiApplication>("/applications", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateApplication(
  token: string,
  id: string,
  data: Record<string, unknown>,
) {
  return apiRequest<ApiApplication>(`/applications/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export function deleteApplication(token: string, id: string) {
  return apiRequest<void>(`/applications/${id}`, {
    method: "DELETE",
    token,
  });
}

export function getInterviews(token: string) {
  return apiRequest<ApiInterview[]>("/interviews", { token });
}

export function createInterview(
  token: string,
  data: Record<string, unknown>,
) {
  return apiRequest<ApiInterview>("/interviews", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateInterview(
  token: string,
  id: string,
  data: Record<string, unknown>,
) {
  return apiRequest<ApiInterview>(`/interviews/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export function deleteInterview(token: string, id: string) {
  return apiRequest<void>(`/interviews/${id}`, {
    method: "DELETE",
    token,
  });
}

export function getResumes(token: string) {
  return apiRequest<ApiResume[]>("/resumes", { token });
}

export function createResume(token: string, data: Record<string, unknown>) {
  return apiRequest<ApiResume>("/resumes", {
    method: "POST", token, body: JSON.stringify(data),
  });
}

export function updateResume(token: string, id: string, data: Record<string, unknown>) {
  return apiRequest<ApiResume>(`/resumes/${id}`, {
    method: "PATCH", token, body: JSON.stringify(data),
  });
}

export function deleteResume(token: string, id: string) {
  return apiRequest<void>(`/resumes/${id}`, { method: "DELETE", token });
}

export function getSkills(token: string) { return apiRequest<ApiSkill[]>("/skills", { token }); }
export function saveResumeDocument(token: string, id: string | null, metadata: Record<string, unknown>, file?: File) {
  const body = new FormData();
  body.append("metadata", JSON.stringify(metadata));
  if (file) body.append("file", file);
  return apiRequest<ApiResume>(id ? `/resumes/${id}/upload` : "/resumes/upload", {
    method: id ? "PUT" : "POST", token, body,
  });
}

export async function downloadResumeFile(token: string, id: string) {
  const response = await fetch(`${API_BASE_URL}/resumes/${id}/download`, {
    cache: "no-store",
    credentials: "omit",
    headers: { Authorization: `Bearer ${token}` },
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail ?? "Unable to download resume.");
  }
  return response.blob();
}

export function extractResumeText(token: string, id: string) {
  return apiRequest<ApiResume>(`/resumes/${id}/extract`, { method: "POST", token });
}
export function createSkill(token: string, data: Record<string, unknown>) { return apiRequest<ApiSkill>("/skills", { method: "POST", token, body: JSON.stringify(data) }); }
export function updateSkill(token: string, id: string, data: Record<string, unknown>) { return apiRequest<ApiSkill>(`/skills/${id}`, { method: "PATCH", token, body: JSON.stringify(data) }); }
export function deleteSkill(token: string, id: string) { return apiRequest<void>(`/skills/${id}`, { method: "DELETE", token }); }

export async function login(email: string, password: string) {
  return apiRequest<{ access_token: string; token_type: string }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
) {
  return apiRequest<ApiUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    }),
  });
}
