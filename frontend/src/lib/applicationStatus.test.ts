import { describe, expect, it } from "vitest";
import {
  APPLICATION_STATUSES,
  fromBackendStatus,
  getTrackStops,
  isInterviewStage,
  toBackendStatus,
} from "@/lib/applicationStatus";

const BACKEND_STATUSES = [
  "SAVED",
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "FINAL_INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

describe("application status mapping", () => {
  it("round-trips every backend status without loss", () => {
    for (const backend of BACKEND_STATUSES) {
      expect(toBackendStatus(fromBackendStatus(backend))).toBe(backend);
    }
  });

  it("exposes one frontend status per backend status", () => {
    expect(new Set(APPLICATION_STATUSES).size).toBe(BACKEND_STATUSES.length);
  });

  it("does not present a saved application as applied", () => {
    expect(fromBackendStatus("SAVED")).toBe("Saved");
    expect(fromBackendStatus("WITHDRAWN")).toBe("Withdrawn");
  });

  it("treats both interview rounds as interview stages", () => {
    expect(isInterviewStage("Interview")).toBe(true);
    expect(isInterviewStage("Final interview")).toBe(true);
    expect(isInterviewStage("Applied")).toBe(false);
  });
});

describe("career track", () => {
  it("marks earlier stops as passed and the current stop", () => {
    const stops = getTrackStops("Interview");
    expect(stops.map((stop) => stop.state)).toEqual([
      "passed",
      "passed",
      "passed",
      "current",
      "upcoming",
      "upcoming",
    ]);
  });

  it("ends the track for closed applications", () => {
    const stops = getTrackStops("Rejected");
    expect(stops.at(-1)?.state).toBe("ended");
  });
});
