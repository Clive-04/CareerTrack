import { describe, expect, it } from "vitest";
import { daysBetween, getNextSteps, type NextStepInput } from "@/lib/nextSteps";

const today = "2026-11-27";

function input(overrides: Partial<NextStepInput> = {}): NextStepInput {
  return { today, jobs: [], applications: [], interviews: [], resumeCount: 1, ...overrides };
}

const job = (id: string, extra = {}) => ({
  id, company: `Company ${id}`, position: `Role ${id}`, latestAnalysisIsStale: false, ...extra,
});

const application = (id: string, jobId: string, status: string, dateApplied: string) => ({
  id, jobId, company: `Company ${jobId}`, position: `Role ${jobId}`, status, dateApplied,
}) as NextStepInput["applications"][number];

describe("getNextSteps", () => {
  it("puts an interview in the next three days first", () => {
    const steps = getNextSteps(input({
      applications: [application("a1", "j1", "Offer", "2026-10-01")],
      interviews: [{ id: "i1", applicationId: "a2", company: "Northwind", position: "Frontend", date: "2026-11-28", time: "10:00", type: "Video", status: "Scheduled" }],
    }));
    expect(steps[0]).toMatchObject({ kind: "interview", href: "/interviews" });
    expect(steps[0].detail).toContain("Tomorrow");
    expect(steps[1]).toMatchObject({ kind: "offer" });
  });

  it("asks for a follow-up after 14 quiet days, oldest first", () => {
    const steps = getNextSteps(input({
      applications: [
        application("a1", "j1", "Applied", "2026-11-10"),
        application("a2", "j2", "Applied", "2026-11-01"),
        application("a3", "j3", "Applied", "2026-11-20"),
      ],
    }));
    const followUps = steps.filter((step) => step.kind === "follow-up");
    expect(followUps.map((step) => step.id)).toEqual(["follow-up-a2", "follow-up-a1"]);
    expect(followUps[0].detail).toContain("26 days");
  });

  it("does not ask for a follow-up when an interview is already recorded", () => {
    const steps = getNextSteps(input({
      applications: [application("a1", "j1", "Applied", "2026-11-01")],
      interviews: [{ id: "i1", applicationId: "a1", company: "C", position: "R", date: "2026-11-05", time: "09:00", type: "Phone", status: "Completed" }],
    }));
    expect(steps.some((step) => step.kind === "follow-up")).toBe(false);
  });

  it("links an outdated resume match to the job's analysis", () => {
    const steps = getNextSteps(input({ jobs: [job("j9", { latestAnalysisIsStale: true })] }));
    expect(steps.find((step) => step.kind === "stale-analysis")?.href).toBe("/jobs?id=j9&analysis=j9");
  });

  it("suggests uploading a resume when there is none", () => {
    expect(getNextSteps(input({ resumeCount: 0 }))[0]).toMatchObject({ kind: "resume", href: "/resumes" });
  });

  it("returns at most five steps", () => {
    const applications = Array.from({ length: 9 }, (_, index) => application(`a${index}`, `j${index}`, "Applied", "2026-10-01"));
    expect(getNextSteps(input({ applications }))).toHaveLength(5);
  });
});

describe("daysBetween", () => {
  it("counts whole calendar days", () => {
    expect(daysBetween("2026-11-01", "2026-11-27")).toBe(26);
  });
});
