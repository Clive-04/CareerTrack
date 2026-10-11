
"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  FileText,
  Building2,
  MapPin,
  CalendarDays,
  X,
  ChevronDown,
} from "lucide-react";

type ApplicationStatus =
  | "Applied"
  | "In Review"
  | "Interview"
  | "Offer"
  | "Rejected";

type Application = {
  id: number;
  company: string;
  position: string;
  location: string;
  dateApplied: string;
  status: ApplicationStatus;
  notes: string;
};

const initialApplications: Application[] = [
  {
    id: 1,
    company: "Google",
    position: "Junior Software Engineer",
    location: "Makati, Philippines",
    dateApplied: "2026-10-09",
    status: "Applied",
    notes: "Submitted application through the company website.",
  },
  {
    id: 2,
    company: "Microsoft",
    position: "Frontend Developer",
    location: "Remote",
    dateApplied: "2026-10-07",
    status: "Interview",
    notes: "Prepare for the technical interview.",
  },
  {
    id: 3,
    company: "Accenture",
    position: "Associate Software Engineer",
    location: "Taguig, Philippines",
    dateApplied: "2026-10-05",
    status: "In Review",
    notes: "Waiting for an update from recruitment.",
  },
  {
    id: 4,
    company: "Canva",
    position: "UI Developer Intern",
    location: "Remote",
    dateApplied: "2026-10-03",
    status: "Rejected",
    notes: "Application closed.",
  },
];

const statuses: ApplicationStatus[] = [
  "Applied",
  "In Review",
  "Interview",
  "Offer",
  "Rejected",
];

const statusStyles: Record<ApplicationStatus, string> = {
  Applied: "bg-blue-50 text-blue-700",
  "In Review": "bg-amber-50 text-amber-700",
  Interview: "bg-purple-50 text-purple-700",
  Offer: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState(initialApplications);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    company: "",
    position: "",
    location: "",
    dateApplied: new Date().toISOString().slice(0, 10),
    status: "Applied" as ApplicationStatus,
    notes: "",
  });

  const filteredApplications = applications.filter((application) => {
    const matchesSearch = (
      `${application.company} ${application.position} ${application.location}`
    )
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All statuses" ||
      application.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function handleAddApplication(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.company.trim() || !form.position.trim()) {
      setError("Company and position are required.");
      return;
    }

    const newApplication: Application = {
      id: Date.now(),
      company: form.company.trim(),
      position: form.position.trim(),
      location: form.location.trim() || "Not specified",
      dateApplied: form.dateApplied,
      status: form.status,
      notes: form.notes.trim(),
    };

    setApplications((current) => [newApplication, ...current]);
    setSearch("");
    setStatusFilter("All statuses");
    setError("");
    setShowForm(false);

    setForm({
      company: "",
      position: "",
      location: "",
      dateApplied: new Date().toISOString().slice(0, 10),
      status: "Applied",
      notes: "",
    });
  }

  function updateStatus(id: number, status: ApplicationStatus) {
    setApplications((current) =>
      current.map((application) =>
        application.id === id
          ? { ...application, status }
          : application,
      ),
    );
  }

  const offerCount = applications.filter(
    (application) => application.status === "Offer",
  ).length;

  const interviewCount = applications.filter(
    (application) => application.status === "Interview",
  ).length;

  const activeCount = applications.filter(
    (application) =>
      application.status !== "Rejected" &&
      application.status !== "Offer",
  ).length;

  return (
    <div className="min-h-screen bg-[#F5F7FB] p-4 text-slate-800 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Your job search
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Applications
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Track your progress from application to offer.
            </p>
          </div>

          <button
            onClick={() => {
              setError("");
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Application
          </button>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Applications"
            value={applications.length}
            icon={<FileText size={21} />}
          />
          <SummaryCard
            title="Active Applications"
            value={activeCount}
            icon={<Building2 size={21} />}
          />
          <SummaryCard
            title="Interviews"
            value={interviewCount}
            icon={<CalendarDays size={21} />}
          />
          <SummaryCard
            title="Offers Received"
            value={offerCount}
            icon={<FileText size={21} />}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-3">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search company, role, or location..."
                className="w-full min-w-0 bg-transparent text-sm outline-none"
              />
            </label>

            <select
              aria-label="Filter by application status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option>All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredApplications.length}
            </span>{" "}
            of {applications.length} applications
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5 sm:px-6">
            <h2 className="text-lg font-bold text-slate-900">
              Application History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update the status as you progress through each hiring process.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4 font-semibold">Company / Position</th>
                  <th className="px-6 py-4 font-semibold">Date Applied</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Update Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {application.company}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {application.position}
                          </p>
                          <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                            <MapPin size={13} />
                            {application.location}
                          </p>
                          {application.notes && (
                            <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                              {application.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500">
                      {new Date(
                        `${application.dateApplied}T12:00:00`,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[application.status]}`}
                      >
                        {application.status}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <label className="relative flex items-center">
                        <select
                          aria-label={`Update status for ${application.company}`}
                          value={application.status}
                          onChange={(event) =>
                            updateStatus(
                              application.id,
                              event.target.value as ApplicationStatus,
                            )
                          }
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm outline-none focus:border-blue-500"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={15}
                          className="pointer-events-none absolute right-2 text-slate-400"
                        />
                      </label>
                    </td>
                  </tr>
                ))}

                {filteredApplications.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-14 text-center text-sm text-slate-500"
                    >
                      No applications found. Try another search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-application-title"
            className="my-4 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="add-application-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Add Application
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Record a job you have applied for.
                </p>
              </div>

              <button
                aria-label="Close form"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddApplication} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Company *">
                  <input
                    required
                    value={form.company}
                    onChange={(event) =>
                      setForm({ ...form, company: event.target.value })
                    }
                    placeholder="e.g. Google"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Position *">
                  <input
                    required
                    value={form.position}
                    onChange={(event) =>
                      setForm({ ...form, position: event.target.value })
                    }
                    placeholder="e.g. Software Engineer"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Location">
                  <input
                    value={form.location}
                    onChange={(event) =>
                      setForm({ ...form, location: event.target.value })
                    }
                    placeholder="e.g. Manila or Remote"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Date Applied">
                  <input
                    type="date"
                    required
                    value={form.dateApplied}
                    onChange={(event) =>
                      setForm({ ...form, dateApplied: event.target.value })
                    }
                    className="form-input"
                  />
                </FormField>

                <FormField label="Application Status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as ApplicationStatus,
                      })
                    }
                    className="form-input"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Notes (optional)">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Recruiter details, follow-up reminders, or other notes..."
                  className="form-input resize-y"
                />
              </FormField>

              {error && (
                <p role="alert" className="text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .form-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.7rem 0.85rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }
        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgb(59 130 246 / 12%);
        }
      `}</style>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">{icon}</div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
