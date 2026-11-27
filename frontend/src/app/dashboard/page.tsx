"use client";

import { Fragment, type CSSProperties } from "react";
import Link from "next/link";
import {
  Bookmark,
  CalendarClock,
  FileUp,
  Handshake,
  Plus,
  RefreshCw,
  Send,
  type LucideIcon,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { CareerTrack, StatusChip } from "@/components/CareerTrack";
import { ListSkeleton } from "@/components/Skeleton";
import { useApplications } from "@/components/ApplicationsProvider";
import { useJobs } from "@/components/JobsProvider";
import { useInterviews } from "@/components/InterviewsProvider";
import { useResumes } from "@/components/ResumesProvider";
import { getApplicationPipeline } from "@/lib/dashboardInsights";
import { TRACK_STAGES, isActiveStatus } from "@/lib/applicationStatus";
import { daysBetween, formatTime, getNextSteps, relativeDay, type NextStep } from "@/lib/nextSteps";

const stepStyle: Record<NextStep["kind"], { icon: LucideIcon; tone: string }> = {
  interview: { icon: CalendarClock, tone: "bg-cyan-50 text-cyan-700" },
  offer: { icon: Handshake, tone: "bg-emerald-50 text-emerald-700" },
  "follow-up": { icon: Send, tone: "bg-amber-50 text-amber-700" },
  "stale-analysis": { icon: RefreshCw, tone: "bg-amber-50 text-amber-700" },
  untracked: { icon: Bookmark, tone: "bg-slate-100 text-slate-600" },
  resume: { icon: FileUp, tone: "bg-indigo-50 text-indigo-700" },
};

function localToday() {
  return new Date().toLocaleDateString("en-CA");
}

export default function DashboardPage() {
  const { applications, isLoading: applicationsLoading } = useApplications();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { interviews, isLoading: interviewsLoading } = useInterviews();
  const { resumes, isLoading: resumesLoading } = useResumes();
  const today = localToday();
  const isLoading = applicationsLoading || jobsLoading || interviewsLoading || resumesLoading;

  const nextSteps = getNextSteps({ today, jobs, applications, interviews, resumeCount: resumes.length });

  const thisWeek = interviews
    .filter((interview) => interview.status === "Scheduled")
    .filter((interview) => {
      const days = daysBetween(today, interview.date);
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  const recentApplications = [...applications]
    .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied) || b.id.localeCompare(a.id))
    .slice(0, 4);

  const pipeline = getApplicationPipeline(applications);
  const countFor = (status: string) => pipeline.find((item) => item.status === status)?.count ?? 0;
  const activeCount = applications.filter((application) => isActiveStatus(application.status)).length;
  const closedCount = countFor("Rejected") + countFor("Withdrawn");
  const isNewWorkspace = !isLoading && jobs.length === 0 && applications.length === 0;

  return (
    <WorkspaceLayout>
      <div className="app-page space-y-10">
        <PageHeader
          title="Overview"
          description={isLoading ? "Loading your job search…" : summaryLine(nextSteps.length, thisWeek.length)}
          action={
            <Link href="/jobs?new=1" className="app-button-primary">
              <Plus size={18} aria-hidden="true" />
              Add job
            </Link>
          }
        />

        {isLoading ? (
          <ListSkeleton rows={4} label="Loading your next steps" />
        ) : isNewWorkspace ? (
          <section className="app-enter app-surface px-6 py-10 sm:px-10" style={{ "--i": 1 } as CSSProperties}>
            <CareerTrack status="Saved" className="max-w-xs" />
            <h2 className="app-section-title mt-6">Start with a role you’re interested in</h2>
            <p className="mt-2 max-w-md text-[0.9375rem] leading-6 text-slate-600">
              Save the job with its full description. When you apply, track it as an application and it moves along each stage here.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/jobs?new=1" className="app-button-secondary">Add your first job</Link>
              {resumes.length === 0 && <Link href="/resumes" className="app-button-ghost">Upload a resume</Link>}
            </div>
          </section>
        ) : (
          <div className="app-enter grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]" style={{ "--i": 1 } as CSSProperties}>
            <section aria-labelledby="next-steps-title">
              <h2 id="next-steps-title" className="app-section-title">Next steps</h2>
              {nextSteps.length === 0 ? (
                <p className="mt-3 border-t border-slate-200 pt-4 text-[0.9375rem] text-slate-600">
                  Nothing needs your attention right now.
                </p>
              ) : (
                <ol className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                  {nextSteps.map((step) => {
                    const { icon: Icon, tone } = stepStyle[step.kind];
                    return (
                      <li key={step.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                        <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tone}`}>
                          <Icon size={18} strokeWidth={1.9} />
                        </span>
                        <div className="min-w-0 flex-[1_1_calc(100%-3.25rem)] sm:flex-1">
                          <p className="font-medium text-slate-900">{step.title}</p>
                          <p className="text-sm text-slate-600">{step.detail}</p>
                        </div>
                        <Link href={step.href} className="app-button-secondary app-button-compact ml-13 sm:ml-0">
                          {step.actionLabel}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <section aria-labelledby="week-title">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="week-title" className="app-section-title">This week</h2>
                <Link href="/interviews" className="app-button-text">All interviews</Link>
              </div>
              {thisWeek.length === 0 ? (
                <p className="mt-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
                  No interviews in the next seven days.
                </p>
              ) : (
                <ol className="mt-3 border-t border-slate-200">
                  {thisWeek.map((interview) => (
                    <li key={interview.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 border-b border-slate-200 py-3">
                      <time dateTime={interview.date} className="text-sm leading-5">
                        <span className="block font-semibold text-slate-900">{relativeDay(interview.date, today)}</span>
                        <span className="block tabular-nums text-slate-500">{formatTime(interview.time)}</span>
                      </time>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{interview.company}</p>
                        <p className="truncate text-sm text-slate-600">{interview.position}</p>
                        <p className="text-[0.8125rem] text-slate-500">{interview.type}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}

        {!isLoading && !isNewWorkspace && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section aria-labelledby="recent-title">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="recent-title" className="app-section-title">Recent applications</h2>
                {applications.length > 0 && <Link href="/applications" className="app-button-text">View all</Link>}
              </div>
              {recentApplications.length === 0 ? (
                <p className="mt-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
                  Open a saved job and choose Track application once you apply.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                  {recentApplications.map((application) => (
                    <li key={application.id} className="grid grid-cols-1 gap-2 py-3.5 sm:grid-cols-[minmax(0,1fr)_11rem_5.5rem] sm:items-center sm:gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{application.position}</p>
                        <p className="truncate text-sm text-slate-600">{application.company}</p>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1.5">
                        <StatusChip status={application.status} />
                        <CareerTrack status={application.status} className="w-28 sm:w-full" />
                      </div>
                      <p className="text-sm tabular-nums text-slate-500 sm:text-right">
                        {application.dateApplied ? shortDate(application.dateApplied) : "Not applied"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="pipeline-title">
              <h2 id="pipeline-title" className="app-section-title">Where things stand</h2>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-semibold tabular-nums text-slate-900">{activeCount}</span> active,{" "}
                <span className="font-semibold tabular-nums text-slate-900">{closedCount}</span> closed
              </p>
              {/* The career track, vertical: one stop per stage with its count. */}
              <ol className="mt-4">
                {TRACK_STAGES.map((stage, index) => {
                  const count = countFor(stage);
                  return (
                    <Fragment key={stage}>
                      <li className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className={`h-3 w-3 shrink-0 rounded-full border-2 ${
                            count > 0
                              ? stage === "Offer" ? "border-emerald-600 bg-emerald-600" : "border-cyan-600 bg-cyan-600"
                              : "border-slate-300 bg-white"
                          }`}
                        />
                        <Link
                          href={`/applications?status=${encodeURIComponent(stage)}`}
                          className="flex flex-1 items-baseline justify-between gap-3 rounded py-1 text-sm hover:text-indigo-700"
                        >
                          <span className={count > 0 ? "text-slate-800" : "text-slate-500"}>{stage}</span>
                          <span className="font-semibold tabular-nums text-slate-900">{count}</span>
                        </Link>
                      </li>
                      {index < TRACK_STAGES.length - 1 && (
                        <li aria-hidden="true" className="ml-[0.3125rem] h-3 w-0.5 bg-slate-200" />
                      )}
                    </Fragment>
                  );
                })}
              </ol>
            </section>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}

function summaryLine(stepCount: number, interviewCount: number) {
  const parts = [];
  parts.push(stepCount === 0 ? "Nothing needs attention" : `${stepCount} ${stepCount === 1 ? "thing needs" : "things need"} your attention`);
  if (interviewCount > 0) parts.push(`${interviewCount} ${interviewCount === 1 ? "interview" : "interviews"} this week`);
  return `${parts.join(" · ")}.`;
}

function shortDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
