"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import {
  BriefcaseBusiness,
  FileText,
  CalendarDays,
  GraduationCap,
  Search,
  Plus,
  Clock3,
  CircleCheck,
  MapPin,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useApplications } from "@/components/ApplicationsProvider";
import { useJobs } from "@/components/JobsProvider";
import { useInterviews } from "@/components/InterviewsProvider";
import { getAiDashboardInsights, getApplicationPipeline } from "@/lib/dashboardInsights";

const statusStyles: Record<string, string> = {
  Applied: "bg-blue-50 text-blue-700",
  Interview: "bg-green-50 text-green-700",
  "In Review": "bg-amber-50 text-amber-700",
  Offer: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
};

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { applications: sharedApplications } = useApplications();
  const { jobs } = useJobs();
  const { interviews } = useInterviews();
  const today = new Date().toLocaleDateString("en-CA");
  const upcomingInterviews = interviews
    .filter(
      (interview) =>
        interview.status === "Scheduled" && interview.date >= today,
    )
    .sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
    )
    .slice(0, 3);

  const companyColors: Record<string, string> = {
    Google: "bg-blue-100 text-blue-700",
    Microsoft: "bg-sky-100 text-sky-700",
    Accenture: "bg-purple-100 text-purple-700",
    Canva: "bg-rose-100 text-rose-700",
  };

  const applications = [...sharedApplications]
    .sort(
      (a, b) =>
        b.dateApplied.localeCompare(a.dateApplied) ||
        b.id.localeCompare(a.id),
    )
    .map((application) => ({
      ...application,
      initials: application.company.slice(0, 1).toUpperCase(),
      color:
        companyColors[application.company] ??
        "bg-blue-100 text-blue-700",
      date: new Date(
        `${application.dateApplied}T12:00:00`,
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }));

  const filteredApplications = applications.filter((application) =>
    `${application.company} ${application.position} ${application.status}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const displayedApplications = filteredApplications.slice(0, 5);
  const { freshAnalyses, outdatedAnalyses, strongestMatch, notAnalyzedCount } = getAiDashboardInsights(jobs);
  const applicationPipeline = getApplicationPipeline(applications);

  return (
    <WorkspaceLayout>
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
            <PageHeader
              eyebrow="Your job search"
              title="Welcome back!"
              description="Here's an overview of your job search progress."
              action={
                <button
                  onClick={() => router.push("/jobs")}
                  className="app-button-primary self-start sm:self-auto"
                >
                  <Plus size={18} />
                  Add a job
                </button>
              }
            />

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Total Applications"
                value={String(applications.length)}
                note="Applications tracked"
                icon={FileText}
                iconStyle="bg-blue-50 text-blue-600"
              />
              <SummaryCard
                title="Interviews"
                value={String(interviews.length)}
                note="Keep preparing"
                icon={CalendarDays}
                iconStyle="bg-purple-50 text-purple-600"
              />
              <SummaryCard
                title="Jobs Saved"
                value={String(jobs.length)}
                note="Opportunities collected"
                icon={BriefcaseBusiness}
                iconStyle="bg-amber-50 text-amber-600"
              />
              <SummaryCard
                title="Offers Received"
                value={String(
                  applications.filter((application) => application.status === "Offer").length,
                )}
                note="A step toward your goal"
                icon={CircleCheck}
                iconStyle="bg-green-50 text-green-600"
              />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="app-surface p-5 sm:p-6 xl:col-span-2">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">AI Resume Insights</h2>
                        <p className="mt-1 text-sm text-slate-500">Current comparisons across your saved jobs.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <InsightMetric label="Fresh" value={freshAnalyses.length} style="bg-emerald-50 text-emerald-700" />
                  <InsightMetric label="Outdated" value={outdatedAnalyses.length} style="bg-amber-50 text-amber-700" />
                  <InsightMetric label="Not analyzed" value={notAnalyzedCount} style="bg-slate-100 text-slate-700" />
                </div>

                {strongestMatch ? (
                  <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl border border-violet-100 bg-violet-50/60 p-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Strongest current match</p>
                      <p className="mt-2 font-bold text-slate-900">{strongestMatch.position}</p>
                      <p className="mt-1 text-sm text-slate-600">{strongestMatch.company}</p>
                    </div>
                    <p className="text-2xl font-bold text-violet-700">{strongestMatch.latestAnalysisScore}/100</p>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-5 text-center">
                    <p className="text-sm font-semibold text-slate-700">No current AI match yet</p>
                    <p className="mt-1 text-xs text-slate-500">Analyze a resume against a saved job to see your strongest match here.</p>
                  </div>
                )}
              </div>

              <div className="app-surface p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600"><AlertTriangle size={20} /></div>
                  <div>
                    <h2 className="font-bold text-slate-900">Needs attention</h2>
                    <p className="mt-1 text-xs text-slate-500">Outdated AI comparisons</p>
                  </div>
                </div>
                {outdatedAnalyses.length ? (
                  <div className="mt-5 space-y-3">
                    {outdatedAnalyses.slice(0, 3).map((job) => (
                      <div key={job.id} className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                        <p className="text-sm font-semibold text-slate-800">{job.position}</p>
                        <p className="mt-1 text-xs text-slate-500">{job.company} · Previous score {job.latestAnalysisScore}/100</p>
                        <p className="mt-2 text-xs font-medium text-amber-700">Open Saved Jobs when you are ready to analyze again.</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="font-semibold">No outdated analyses</p>
                    <p className="mt-1 text-xs leading-5">Your saved AI comparisons are current.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="app-surface p-5 sm:p-6 xl:col-span-2">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Recent Applications
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Keep track of your latest opportunities.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                    <Search size={17} className="text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search applications"
                      className="w-full min-w-0 bg-transparent text-sm outline-none sm:w-40"
                    />
                  </label>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                        <th scope="col" className="pb-3 pr-4 font-semibold">Company / Role</th>
                        <th scope="col" className="pb-3 pr-4 font-semibold">Date Applied</th>
                        <th scope="col" className="pb-3 pr-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedApplications.map((application) => (
                        <tr
                          key={application.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                        >
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${application.color}`}
                              >
                                {application.initials}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {application.company}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {application.position}
                                </p>
                                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                  <MapPin size={12} />
                                  {application.location}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 pr-4 text-sm text-slate-500">
                            {application.date}
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[application.status]}`}
                            >
                              {application.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {displayedApplications.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="py-10 text-center text-sm text-slate-500"
                          >
                            No applications match your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <DashboardAction onClick={() => router.push("/applications")} className="mt-4">View all applications</DashboardAction>
              </div>

              <div className="space-y-6">
                <div className="app-surface p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Upcoming Interviews
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Stay ready for your next step.
                      </p>
                    </div>
                    <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                      <Clock3 size={20} />
                    </div>
                  </div>
                  {upcomingInterviews.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center">
                      <CalendarDays
                        size={28}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No upcoming interviews
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Your scheduled interviews will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {upcomingInterviews.map((interview) => (
                        <div
                          key={interview.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                        >
                          <p className="font-semibold text-slate-800">
                            {interview.position}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {interview.company}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {formatDashboardDate(interview.date)} · {interview.time} · {interview.type}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <DashboardAction onClick={() => router.push("/interviews")} className="mt-4">Manage interviews</DashboardAction>
                </div>

                <div className="app-surface p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-slate-900">Application Pipeline</h3>
                  <p className="mt-1 text-sm text-slate-500">Where your applications currently stand.</p>
                  <div className="mt-5 space-y-4">
                    {applicationPipeline.map(({ status, count, percentage }) => {
                      return <div key={status}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{status}</span>
                          <span className="text-slate-500">{count}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>;
                    })}
                  </div>
                  <DashboardAction onClick={() => router.push("/applications")} className="mt-5">View application pipeline</DashboardAction>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-[#172B4D] to-[#264B80] p-6 text-white">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <GraduationCap size={23} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">Ready for your next step?</h3>
                  <p className="mt-2 text-sm leading-6 text-blue-100">
                    Keep your resume updated and highlight the skills that match your target roles.
                  </p>
                  <button
                    onClick={() => router.push("/resumes")}
                    className="mt-5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#172B4D] transition hover:bg-blue-50"
                  >
                    Review my resumes
                  </button>
                </div>
              </div>
            </section>

            <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-400">
              CareerTrack · Stay organized. Move forward.
            </footer>
          </div>
    </WorkspaceLayout>
  );
}

function formatDashboardDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InsightMetric({ label, value, style }: { label: string; value: number; style: string }) {
  return (
    <div className={`rounded-xl p-3 text-center ${style}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-medium">{label}</p>
    </div>
  );
}

function DashboardAction({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`app-arrow-action inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-px hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-700 hover:shadow-md hover:shadow-indigo-100 ${className}`}
    >
      {children}
      <span className="app-arrow-badge bg-indigo-50 text-indigo-600">
        <ArrowRight size={14} aria-hidden="true" />
      </span>
    </button>
  );
}

function SummaryCard({
  title,
  value,
  note,
  icon: Icon,
  iconStyle,
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof FileText;
  iconStyle: string;
}) {
  return (
    <div className="app-surface app-surface-interactive p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${iconStyle}`}>
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">{note}</p>
    </div>
  );
}
