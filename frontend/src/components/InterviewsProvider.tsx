"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  useApplications,
  type Application,
} from "@/components/ApplicationsProvider";
import {
  createInterview as createInterviewRequest,
  deleteInterview as deleteInterviewRequest,
  getInterviews,
  updateInterview as updateInterviewRequest,
  type ApiInterview,
} from "@/lib/api";

export type InterviewStatus = "Scheduled" | "Completed" | "Cancelled";
export type InterviewType = "Video" | "Phone" | "On-site";

export type Interview = {
  id: string;
  applicationId: string;
  company: string;
  position: string;
  date: string;
  time: string;
  type: InterviewType;
  location: string;
  status: InterviewStatus;
  notes: string;
};

export type InterviewInput = {
  applicationId: string;
  date: string;
  time: string;
  type: InterviewType;
  location: string;
  status: InterviewStatus;
  notes: string;
};

type InterviewsContextValue = {
  interviews: Interview[];
  isLoading: boolean;
  error: string;
  createInterview: (input: InterviewInput) => Promise<void>;
  updateInterview: (id: string, input: InterviewInput) => Promise<void>;
  updateInterviewStatus: (
    id: string,
    status: InterviewStatus,
  ) => Promise<void>;
  deleteInterview: (id: string) => Promise<void>;
};

const InterviewsContext = createContext<InterviewsContextValue | null>(null);

const backendStatusByFrontendStatus: Record<InterviewStatus, string> = {
  Scheduled: "SCHEDULED",
  Completed: "COMPLETED",
  Cancelled: "CANCELLED",
};

const frontendStatusByBackendStatus: Record<string, InterviewStatus> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function mapInterview(
  interview: ApiInterview,
  applications: Application[],
): Interview {
  const application = applications.find(
    (item) => item.id === interview.application_id,
  );
  const scheduledAt = new Date(interview.scheduled_at);

  return {
    id: interview.id,
    applicationId: interview.application_id,
    company: application?.company ?? "Unknown company",
    position: application?.position ?? "Unknown position",
    date: scheduledAt.toLocaleDateString("en-CA"),
    time: scheduledAt.toTimeString().slice(0, 5),
    type: (interview.type as InterviewType) || "Video",
    location: interview.location ?? "",
    status: frontendStatusByBackendStatus[interview.status] ?? "Scheduled",
    notes: interview.notes ?? "",
  };
}

function toBackendInterview(input: InterviewInput) {
  return {
    application_id: input.applicationId,
    scheduled_at: `${input.date}T${input.time}:00`,
    type: input.type,
    location: input.location || null,
    status: backendStatusByFrontendStatus[input.status],
    notes: input.notes || null,
  };
}

export default function InterviewsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { token, isLoading: authLoading } = useAuth();
  const { applications, isLoading: applicationsLoading } = useApplications();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || applicationsLoading) return;
    if (!token) return;

    getInterviews(token)
      .then((response) => {
        setInterviews(
          response.map((item) => mapInterview(item, applications)),
        );
        setError("");
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load interviews.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [applications, applicationsLoading, authLoading, token]);

  async function createInterview(input: InterviewInput) {
    if (!token) throw new Error("You must be signed in to create an interview.");
    const response = await createInterviewRequest(
      token,
      toBackendInterview(input),
    );
    setInterviews((current) => [mapInterview(response, applications), ...current]);
  }

  async function updateInterview(id: string, input: InterviewInput) {
    if (!token) throw new Error("You must be signed in to update an interview.");
    const response = await updateInterviewRequest(
      token,
      id,
      toBackendInterview(input),
    );
    setInterviews((current) =>
      current.map((item) =>
        item.id === id ? mapInterview(response, applications) : item,
      ),
    );
  }

  async function updateInterviewStatus(
    id: string,
    status: InterviewStatus,
  ) {
    if (!token) throw new Error("You must be signed in to update an interview.");
    const response = await updateInterviewRequest(token, id, {
      status: backendStatusByFrontendStatus[status],
    });
    setInterviews((current) =>
      current.map((item) =>
        item.id === id ? mapInterview(response, applications) : item,
      ),
    );
  }

  async function deleteInterview(id: string) {
    if (!token) throw new Error("You must be signed in to delete an interview.");
    await deleteInterviewRequest(token, id);
    setInterviews((current) => current.filter((item) => item.id !== id));
  }

  return (
    <InterviewsContext.Provider
      value={{
        interviews,
        isLoading,
        error,
        createInterview,
        updateInterview,
        updateInterviewStatus,
        deleteInterview,
      }}
    >
      {children}
    </InterviewsContext.Provider>
  );
}

export function useInterviews() {
  const context = useContext(InterviewsContext);
  if (context === null) {
    throw new Error("useInterviews must be used inside InterviewsProvider.");
  }
  return context;
}
