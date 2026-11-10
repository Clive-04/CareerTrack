import type { Application, ApplicationStatus } from "@/components/ApplicationsProvider";
import type { Job } from "@/components/JobsProvider";

export const PIPELINE_STATUSES: ApplicationStatus[] = [
  "Applied",
  "In Review",
  "Interview",
  "Offer",
  "Rejected",
];

export function getAiDashboardInsights(jobs: Job[]) {
  const analyzedJobs = jobs.filter((job) => job.latestAnalysisScore !== null);
  const freshAnalyses = analyzedJobs.filter((job) => !job.latestAnalysisIsStale);
  const outdatedAnalyses = analyzedJobs.filter((job) => job.latestAnalysisIsStale);
  const strongestMatch = [...freshAnalyses].sort(
    (a, b) => (b.latestAnalysisScore ?? 0) - (a.latestAnalysisScore ?? 0),
  )[0] ?? null;

  return {
    freshAnalyses,
    outdatedAnalyses,
    strongestMatch,
    notAnalyzedCount: jobs.length - analyzedJobs.length,
  };
}

export function getApplicationPipeline(applications: Application[]) {
  return PIPELINE_STATUSES.map((status) => {
    const count = applications.filter((application) => application.status === status).length;
    return {
      status,
      count,
      percentage: applications.length ? Math.round((count / applications.length) * 100) : 0,
    };
  });
}
