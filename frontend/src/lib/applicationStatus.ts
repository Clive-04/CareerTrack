export const APPLICATION_STATUSES = [
  "Saved",
  "Applied",
  "Assessment",
  "Interview",
  "Final interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Stages drawn on the career track, in order. Closed outcomes end the track. */
export const TRACK_STAGES: ApplicationStatus[] = [
  "Saved",
  "Applied",
  "Assessment",
  "Interview",
  "Final interview",
  "Offer",
];

const CLOSED_STATUSES: ApplicationStatus[] = ["Rejected", "Withdrawn"];

const BACKEND_BY_STATUS: Record<ApplicationStatus, string> = {
  Saved: "SAVED",
  Applied: "APPLIED",
  Assessment: "ASSESSMENT",
  Interview: "INTERVIEW",
  "Final interview": "FINAL_INTERVIEW",
  Offer: "OFFER",
  Rejected: "REJECTED",
  Withdrawn: "WITHDRAWN",
};

const STATUS_BY_BACKEND = Object.fromEntries(
  Object.entries(BACKEND_BY_STATUS).map(([status, backend]) => [backend, status]),
) as Record<string, ApplicationStatus>;

export function toBackendStatus(status: ApplicationStatus) {
  return BACKEND_BY_STATUS[status];
}

export function fromBackendStatus(status: string): ApplicationStatus {
  return STATUS_BY_BACKEND[status] ?? "Saved";
}

export function isClosedStatus(status: ApplicationStatus) {
  return CLOSED_STATUSES.includes(status);
}

export function isInterviewStage(status: ApplicationStatus) {
  return status === "Interview" || status === "Final interview";
}

/** Applications still moving forward (not offered, rejected, or withdrawn). */
export function isActiveStatus(status: ApplicationStatus) {
  return status !== "Offer" && !isClosedStatus(status);
}

export type StatusTone = "neutral" | "active" | "success" | "closed" | "danger";

export function statusTone(status: ApplicationStatus): StatusTone {
  if (status === "Offer") return "success";
  if (status === "Rejected") return "danger";
  if (status === "Withdrawn") return "closed";
  if (status === "Saved") return "neutral";
  return "active";
}

export type TrackStopState = "passed" | "current" | "upcoming" | "ended";

export function getTrackStops(status: ApplicationStatus) {
  if (isClosedStatus(status)) {
    // The furthest stage reached before closing is not stored, so the track
    // shows a single closing stop rather than inventing progress.
    return TRACK_STAGES.map((stage, index) => ({
      stage,
      state: (index === TRACK_STAGES.length - 1 ? "ended" : "upcoming") as TrackStopState,
    }));
  }

  const currentIndex = TRACK_STAGES.indexOf(status);
  return TRACK_STAGES.map((stage, index) => ({
    stage,
    state: (index < currentIndex ? "passed" : index === currentIndex ? "current" : "upcoming") as TrackStopState,
  }));
}
