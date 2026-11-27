import type { ApplicationStatus } from "@/lib/applicationStatus";

/** Days without a recorded reply before an application is flagged for follow-up. */
export const FOLLOW_UP_AFTER_DAYS = 14;
const INTERVIEW_HORIZON_DAYS = 3;
const MAX_STEPS = 5;

export type NextStepInput = {
  today: string;
  jobs: { id: string; company: string; position: string; latestAnalysisIsStale: boolean }[];
  applications: { id: string; jobId: string; company: string; position: string; status: ApplicationStatus | string; dateApplied: string }[];
  interviews: { id: string; applicationId: string; company: string; position: string; date: string; time: string; type: string; status: string }[];
  resumeCount: number;
};

export type NextStep = {
  id: string;
  kind: "interview" | "offer" | "follow-up" | "stale-analysis" | "untracked" | "resume";
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
};

export function daysBetween(from: string, to: string) {
  const start = Date.UTC(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 1, Number(from.slice(8, 10)));
  const end = Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 1, Number(to.slice(8, 10)));
  return Math.round((end - start) / 86_400_000);
}

export function relativeDay(date: string, today: string) {
  const days = daysBetween(today, date);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" });
}

export function formatTime(time: string) {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date();
  value.setHours(hours, minutes, 0, 0);
  return value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/**
 * Answers "what should I do now?" from data already loaded on the client.
 * Ordered by urgency: imminent interviews, offers awaiting a decision,
 * overdue follow-ups (oldest first), outdated resume matches, then setup gaps.
 */
export function getNextSteps({ today, jobs, applications, interviews, resumeCount }: NextStepInput): NextStep[] {
  const steps: NextStep[] = [];

  if (resumeCount === 0) {
    steps.push({
      id: "resume",
      kind: "resume",
      title: "Upload a resume",
      detail: "You need one before you can compare it with a saved job.",
      href: "/resumes",
      actionLabel: "Upload resume",
    });
  }

  interviews
    .filter((interview) => interview.status === "Scheduled")
    .filter((interview) => {
      const days = daysBetween(today, interview.date);
      return days >= 0 && days <= INTERVIEW_HORIZON_DAYS;
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .forEach((interview) => steps.push({
      id: `interview-${interview.id}`,
      kind: "interview",
      title: `Prepare for the ${interview.company} interview`,
      detail: `${interview.position} · ${relativeDay(interview.date, today)} at ${formatTime(interview.time)} · ${interview.type}`,
      href: "/interviews",
      actionLabel: "View interview",
    }));

  applications
    .filter((application) => application.status === "Offer")
    .forEach((application) => steps.push({
      id: `offer-${application.id}`,
      kind: "offer",
      title: `Decide on the ${application.company} offer`,
      detail: application.position,
      href: `/applications?q=${encodeURIComponent(application.position)}`,
      actionLabel: "Review offer",
    }));

  const withInterviews = new Set(interviews.map((interview) => interview.applicationId));
  applications
    .filter((application) => (application.status === "Applied" || application.status === "Assessment")
      && application.dateApplied
      && !withInterviews.has(application.id)
      && daysBetween(application.dateApplied, today) >= FOLLOW_UP_AFTER_DAYS)
    .sort((a, b) => a.dateApplied.localeCompare(b.dateApplied))
    .forEach((application) => steps.push({
      id: `follow-up-${application.id}`,
      kind: "follow-up",
      title: `Follow up with ${application.company}`,
      detail: `${application.position} · applied ${daysBetween(application.dateApplied, today)} days ago, no reply recorded`,
      href: `/applications?q=${encodeURIComponent(application.position)}`,
      actionLabel: "Update status",
    }));

  jobs
    .filter((job) => job.latestAnalysisIsStale)
    .forEach((job) => steps.push({
      id: `stale-${job.id}`,
      kind: "stale-analysis",
      title: "Re-run an outdated resume match",
      detail: `${job.position} at ${job.company} changed since it was analyzed`,
      href: `/jobs?id=${job.id}&analysis=${job.id}`,
      actionLabel: "Re-run match",
    }));

  const tracked = new Set(applications.map((application) => application.jobId));
  const untracked = jobs.filter((job) => !tracked.has(job.id)).length;
  if (untracked > 0) {
    steps.push({
      id: "untracked",
      kind: "untracked",
      title: `Decide on ${untracked} saved ${untracked === 1 ? "job" : "jobs"}`,
      detail: "Track an application once you apply, or remove roles you’ve ruled out.",
      href: "/jobs",
      actionLabel: "Review jobs",
    });
  }

  return steps.slice(0, MAX_STEPS);
}
