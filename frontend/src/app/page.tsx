"use client";

import { useState } from "react";
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
} from "lucide-react";

const applications = [
  {
    company: "Google",
    initials: "G",
    color: "bg-blue-100 text-blue-700",
    position: "Junior Software Engineer",
    location: "Makati, Philippines",
    date: "Oct 9, 2026",
    status: "Applied",
  },
  {
    company: "Microsoft",
    initials: "M",
    color: "bg-sky-100 text-sky-700",
    position: "Frontend Developer",
    location: "Remote",
    date: "Oct 7, 2026",
    status: "Interview",
  },
  {
    company: "Accenture",
    initials: "A",
    color: "bg-purple-100 text-purple-700",
    position: "Associate Software Engineer",
    location: "Taguig, Philippines",
    date: "Oct 5, 2026",
    status: "In Review",
  },
  {
    company: "Canva",
    initials: "C",
    color: "bg-rose-100 text-rose-700",
    position: "UI Developer Intern",
    location: "Remote",
    date: "Oct 3, 2026",
    status: "Rejected",
  },
];

const statusStyles: Record<string, string> = {
  Applied: "bg-blue-50 text-blue-700",
  Interview: "bg-green-50 text-green-700",
  "In Review": "bg-amber-50 text-amber-700",
  Rejected: "bg-red-50 text-red-700",
};

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filteredApplications = applications.filter((application) =>
    `${application.company} ${application.position} ${application.status}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

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
                  className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:self-auto"
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
                value="3"
                note="Keep preparing"
                icon={CalendarDays}
                iconStyle="bg-purple-50 text-purple-600"
              />
              <SummaryCard
                title="Jobs Saved"
                value="5"
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
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 xl:col-span-2">
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
                        <th className="pb-3 pr-4 font-semibold">Company / Role</th>
                        <th className="pb-3 pr-4 font-semibold">Date Applied</th>
                        <th className="pb-3 pr-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((application) => (
                        <tr
                          key={application.company}
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
                      {filteredApplications.length === 0 && (
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

                <button
                  onClick={() => router.push("/applications")}
                  className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all applications →
                </button>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
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
                  <button
                    onClick={() => router.push("/interviews")}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Manage interviews →
                  </button>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
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
