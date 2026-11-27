"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { CareerTrack, StatusChip } from "@/components/CareerTrack";
import { useApplications } from "@/components/ApplicationsProvider";
import { useJobs } from "@/components/JobsProvider";
import { useInterviews } from "@/components/InterviewsProvider";
import { getAiDashboardInsights, getApplicationPipeline } from "@/lib/dashboardInsights";
import { TRACK_STAGES, isActiveStatus } from "@/lib/applicationStatus";

export default function DashboardPage() {
  const { applications, isLoading: applicationsLoading } = useApplications();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { interviews } = useInterviews();
  const today = new Date().toLocaleDateString("en-CA");

  const upcomingInterviews = interviews
    .filter((interview) => interview.status === "Scheduled" && interview.date >= today)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 3);

  const recentApplications = [...applications]
    .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied) || b.id.localeCompare(a.id))
    .slice(0, 5);

  const pipeline = getApplicationPipeline(applications);
  const countFor = (status: string) => pipeline.find((item) => item.status === status)?.count ?? 0;
  const activeCount = applications.filter((application) => isActiveStatus(application.status)).length;
  const closedCount = countFor("Rejected") + countFor("Withdrawn");
  const { outdatedAnalyses, strongestMatch, notAnalyzedCount } = getAiDashboardInsights(jobs);
  const isLoading = applicationsLoading || jobsLoading;
  const isNewWorkspace = !isLoading && jobs.length === 0 && applications.length === 0;

  return (
    <WorkspaceLayout>
      <div className="app-page space-y-8">
        <PageHeader
          title="Overview"
          description="Where your job search stands today."
          action={
            <Link href="/jobs?new=1" className="app-button-primary">
              <Plus size={18} aria-hidden="true" />
              Add job
            </Link>
          }
        />

        {isNewWorkspace ? (
          <section className="app-surface px-6 py-10 text-center sm:px-10">
            <CareerTrack status="Saved" className="mx-auto max-w-xs" />
            <h2 className="app-section-title mt-6">Start your track</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.9375rem] leading-6 text-slate-500">
              Add a job you’re interested in. When you apply, track it as an application and it will move along each stage here.
            </p>
          </section>
        ) : (
          <section aria-labelledby="pipeline-title" className="app-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2 id="pipeline-title" className="app-section-title">Pipeline</h2>
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-800 tabular-nums">{activeCount}</span> active
                {" · "}
                <span className="font-semibold text-slate-800 tabular-nums">{closedCount}</span> closed
              </p>
            </div>

            {/* The career track at full size: one stop per stage, with counts. */}
            <ol className="mt-6 grid grid-cols-3 gap-y-6 sm:flex sm:items-start">
              {TRACK_STAGES.map((stage, index) => {
                const count = countFor(stage);
                return (
                  <Fragment key={stage}>
                    {index > 0 && (
                      <li aria-hidden="true" className="hidden h-0.5 flex-1 translate-y-[0.4375rem] bg-slate-200 sm:block" />
                    )}
                    <li className="flex flex-col items-center text-center sm:min-w-[5.5rem]">
                      <span
                        aria-hidden="true"
                        className={`h-4 w-4 rounded-full border-2 ${
                          count > 0
                            ? stage === "Offer" ? "border-emerald-600 bg-emerald-600" : "border-cyan-600 bg-cyan-600"
                            : "border-slate-300 bg-white"
                        }`}
                      />
                      <Link
                        href={`/applications?status=${encodeURIComponent(stage)}`}
                        className="mt-2 rounded px-1 text-2xl font-semibold tabular-nums text-slate-900 hover:text-indigo-700"
                        aria-label={`${count} ${count === 1 ? "application" : "applications"} at ${stage}`}
                      >
                        {isLoading ? "–" : count}
                      </Link>
                      <span className="text-[0.8125rem] text-slate-500">{stage}</span>
                    </li>
                  </Fragment>
                );
              })}
            </ol>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section aria-labelledby="recent-title" className="app-surface lg:col-span-2">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 id="recent-title" className="app-section-title">Recent applications</h2>
              {applications.length > 0 && (
                <Link href="/applications" className="app-button-text">View all</Link>
              )}
            </div>

            {recentApplications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="font-medium text-slate-800">No applications yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  {jobs.length > 0
                    ? "Open a saved job and choose Track application once you apply."
                    : "Add a job first, then track your application to it."}
                </p>
                {jobs.length > 0 && (
                  <Link href="/jobs" className="app-button-secondary app-button-compact mt-4">Go to jobs</Link>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {recentApplications.map((application) => (
                  <li key={application.id} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_12rem_6.5rem] sm:items-center sm:px-6">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{application.position}</p>
                      <p className="truncate text-sm text-slate-500">{application.company}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1.5">
                      <StatusChip status={application.status} />
                      <CareerTrack status={application.status} className="w-28 sm:w-full" />
                    </div>
                    <p className="text-sm text-slate-500 tabular-nums sm:text-right">
                      {application.dateApplied ? formatDate(application.dateApplied) : "Not applied"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="interviews-title" className="app-surface">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <h2 id="interviews-title" className="app-section-title">Upcoming interviews</h2>
              {interviews.length > 0 && <Link href="/interviews" className="app-button-text">View all</Link>}
            </div>
            {upcomingInterviews.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="font-medium text-slate-800">Nothing scheduled</p>
                <p className="mt-1 text-sm text-slate-500">Scheduled interviews appear here with their date and time.</p>
                <Link href="/interviews" className="app-button-secondary app-button-compact mt-4">Schedule an interview</Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {upcomingInterviews.map((interview) => {
                  const date = new Date(`${interview.date}T00:00:00`);
                  return (
                    <li key={interview.id} className="flex gap-4 px-5 py-4">
                      <time
                        dateTime={interview.date}
                        className="flex w-12 shrink-0 flex-col items-center rounded-md border border-slate-200 py-1 leading-tight"
                      >
                        <span className="text-xs text-slate-500">{date.toLocaleDateString("en-US", { month: "short" })}</span>
                        <span className="text-lg font-semibold text-slate-900">{date.getDate()}</span>
                      </time>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{interview.position}</p>
                        <p className="truncate text-sm text-slate-500">{interview.company}</p>
                        <p className="mt-1 text-[0.8125rem] text-slate-500">{interview.time} · {interview.type}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {jobs.length > 0 && (
          <section aria-labelledby="matches-title" className="app-surface">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 id="matches-title" className="app-section-title">Resume matches</h2>
              <p className="mt-1 text-sm text-slate-500">How your resumes compare with your saved jobs.</p>
            </div>
            <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
              <div className="px-5 py-5 sm:px-6">
                <h3 className="text-sm font-medium text-slate-500">Strongest current match</h3>
                {strongestMatch ? (
                  <>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                      {strongestMatch.latestAnalysisScore}<span className="text-base font-normal text-slate-500">/100</span>
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-700">{strongestMatch.position} at {strongestMatch.company}</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No current analysis yet.</p>
                )}
              </div>

              <div className="px-5 py-5 sm:px-6 md:col-span-2">
                <h3 className="text-sm font-medium text-slate-500">
                  {outdatedAnalyses.length > 0 ? "Out of date" : "Coverage"}
                </h3>
                {outdatedAnalyses.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {outdatedAnalyses.slice(0, 3).map((job) => (
                      <li key={job.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <span className="min-w-0 text-sm text-slate-700">
                          <span className="font-medium text-slate-900">{job.position}</span> at {job.company}
                          <span className="text-slate-500"> · was {job.latestAnalysisScore}/100</span>
                        </span>
                        <Link href={`/jobs?analysis=${job.id}`} className="app-button-text">Re-run analysis</Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">
                    {notAnalyzedCount > 0
                      ? `${notAnalyzedCount} saved ${notAnalyzedCount === 1 ? "job has" : "jobs have"} not been analyzed. `
                      : "Every analysis is current. "}
                    {notAnalyzedCount > 0 && <Link href="/jobs" className="app-button-text">Choose a job</Link>}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </WorkspaceLayout>
  );
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
