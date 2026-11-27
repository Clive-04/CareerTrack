import { Fragment } from "react";
import {
  getTrackStops,
  isClosedStatus,
  statusTone,
  type ApplicationStatus,
} from "@/lib/applicationStatus";

/**
 * The career track: an application's progress drawn as a line with a stop per
 * stage, echoing the CareerTrack logo. The status text is always rendered
 * alongside, so progress is never communicated by color or shape alone.
 */
export function CareerTrack({
  status,
  className = "",
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  const stops = getTrackStops(status);

  return (
    <div className={`career-track ${className}`} aria-hidden="true">
      {stops.map((stop, index) => (
        <Fragment key={stop.stage}>
          {index > 0 && (
            <span
              className="career-track-line"
              data-state={stop.state === "passed" || stop.state === "current" ? "passed" : "upcoming"}
            />
          )}
          <span
            className="career-track-stop"
            data-state={stop.state}
            data-outcome={status === "Offer" ? "offer" : undefined}
            title={stop.stage}
          />
        </Fragment>
      ))}
    </div>
  );
}

export function StatusChip({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`app-chip app-chip-${statusTone(status)}`}>
      {isClosedStatus(status) && <span aria-hidden="true">■</span>}
      {status}
    </span>
  );
}

/** Track plus readable status, for list rows. */
export function ApplicationProgress({ status }: { status: ApplicationStatus }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <StatusChip status={status} />
      <CareerTrack status={status} className="w-full max-w-44" />
    </div>
  );
}
