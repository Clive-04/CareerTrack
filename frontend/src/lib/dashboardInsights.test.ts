import { describe, expect, it } from "vitest";
import type { Application } from "@/components/ApplicationsProvider";
import type { Job } from "@/components/JobsProvider";
import { getAiDashboardInsights, getApplicationPipeline } from "@/lib/dashboardInsights";

function job(overrides: Partial<Job>): Job {
  return {
    id: "job-1",
    company: "Example",
    position: "Developer",
    location: "Remote",
    employmentType: "Full-time",
    salary: "Not specified",
    dateAdded: "Nov 3, 2026",
    description: "Detailed job description",
    latestAnalysisScore: null,
    latestAnalysisResumeId: null,
    latestAnalysisCreatedAt: null,
    latestAnalysisIsStale: false,
    latestAnalysisStaleReasons: [],
    ...overrides,
  };
}

function application(status: Application["status"], id: string): Application {
  return {
    id,
    jobId: "job-1",
    company: "Example",
    position: "Developer",
    location: "Remote",
    dateApplied: "2026-11-03",
    status,
    notes: "",
    resumeId: "resume-1",
    resumeName: "Main resume",
  };
}

describe("getAiDashboardInsights", () => {
  it("separates fresh, outdated, and unanalyzed jobs", () => {
    const result = getAiDashboardInsights([
      job({ id: "fresh", latestAnalysisScore: 72 }),
      job({ id: "outdated", latestAnalysisScore: 91, latestAnalysisIsStale: true }),
      job({ id: "none" }),
    ]);

    expect(result.freshAnalyses.map((item) => item.id)).toEqual(["fresh"]);
    expect(result.outdatedAnalyses.map((item) => item.id)).toEqual(["outdated"]);
    expect(result.notAnalyzedCount).toBe(1);
  });

  it("chooses the strongest fresh result and ignores a higher outdated score", () => {
    const result = getAiDashboardInsights([
      job({ id: "current-low", latestAnalysisScore: 70 }),
      job({ id: "current-high", latestAnalysisScore: 84 }),
      job({ id: "old-high", latestAnalysisScore: 99, latestAnalysisIsStale: true }),
    ]);

    expect(result.strongestMatch?.id).toBe("current-high");
  });

  it("returns no strongest match when nothing is current", () => {
    const result = getAiDashboardInsights([
      job({ latestAnalysisScore: 90, latestAnalysisIsStale: true }),
      job({ id: "none" }),
    ]);

    expect(result.strongestMatch).toBeNull();
  });
});

describe("getApplicationPipeline", () => {
  it("counts every status and calculates percentages", () => {
    const result = getApplicationPipeline([
      application("Applied", "1"),
      application("Applied", "2"),
      application("Interview", "3"),
      application("Offer", "4"),
    ]);

    expect(result.find((item) => item.status === "Applied")).toMatchObject({ count: 2, percentage: 50 });
    expect(result.find((item) => item.status === "Interview")).toMatchObject({ count: 1, percentage: 25 });
    expect(result.find((item) => item.status === "Rejected")).toMatchObject({ count: 0, percentage: 0 });
  });

  it("uses zero percentages for an empty pipeline", () => {
    expect(getApplicationPipeline([]).every((item) => item.percentage === 0)).toBe(true);
  });
});
