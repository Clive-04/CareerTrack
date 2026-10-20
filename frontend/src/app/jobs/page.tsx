"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import {
  Search,
  Plus,
  BriefcaseBusiness,
  MapPin,
  Clock3,
  Building2,
  X,
  SlidersHorizontal,
} from "lucide-react";

type Job = {
  id: number;
  company: string;
  position: string;
  location: string;
  employmentType: string;
  salary: string;
  dateAdded: string;
  description: string;
};

const initialJobs: Job[] = [
  {
    id: 1,
    company: "Google",
    position: "Junior Software Engineer",
    location: "Makati, Philippines",
    employmentType: "Full-time",
    salary: "₱35,000–₱50,000 / month",
    dateAdded: "Oct 9, 2026",
    description:
      "Work with an engineering team to develop, test, and maintain software applications.",
  },
  {
    id: 2,
    company: "Microsoft",
    position: "Frontend Developer",
    location: "Remote",
    employmentType: "Full-time",
    salary: "₱40,000–₱60,000 / month",
    dateAdded: "Oct 8, 2026",
    description:
      "Build responsive user interfaces and collaborate with designers and backend developers.",
  },
  {
    id: 3,
    company: "Accenture",
    position: "Associate Software Engineer",
    location: "Taguig, Philippines",
    employmentType: "Full-time",
    salary: "Not specified",
    dateAdded: "Oct 7, 2026",
    description:
      "Support application development, software testing, and technical problem-solving.",
  },
  {
    id: 4,
    company: "Canva",
    position: "UI Developer Intern",
    location: "Remote",
    employmentType: "Internship",
    salary: "Not specified",
    dateAdded: "Oct 6, 2026",
    description:
      "Help implement accessible interfaces and improve the user experience of web products.",
  },
  {
    id: 5,
    company: "IBM",
    position: "IT Support Associate",
    location: "Quezon City, Philippines",
    employmentType: "Contract",
    salary: "₱25,000–₱35,000 / month",
    dateAdded: "Oct 5, 2026",
    description:
      "Assist users with technical issues and support daily IT operations.",
  },
];

const employmentTypes = [
  "All types",
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
];

export default function JobsPage() {
  const [jobs, setJobs] = useState(initialJobs);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [locationFilter, setLocationFilter] = useState("All locations");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    company: "",
    position: "",
    location: "",
    employmentType: "Full-time",
    salary: "",
    description: "",
  });

  const locations = useMemo(
    () => ["All locations", ...new Set(jobs.map((job) => job.location))],
    [jobs],
  );

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = `${job.company} ${job.position} ${job.location}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesType =
      typeFilter === "All types" || job.employmentType === typeFilter;

    const matchesLocation =
      locationFilter === "All locations" || job.location === locationFilter;

    return matchesSearch && matchesType && matchesLocation;
  });

  function handleAddJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.company.trim() || !form.position.trim()) {
      setError("Company and position are required.");
      return;
    }

    const newJob: Job = {
      id: Date.now(),
      company: form.company.trim(),
      position: form.position.trim(),
      location: form.location.trim() || "Not specified",
      employmentType: form.employmentType,
      salary: form.salary.trim() || "Not specified",
      dateAdded: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      description: form.description.trim() || "No description provided.",
    };

    setJobs((currentJobs) => [newJob, ...currentJobs]);
    setSearch("");
    setTypeFilter("All types");
    setLocationFilter("All locations");
    setForm({
      company: "",
      position: "",
      location: "",
      employmentType: "Full-time",
      salary: "",
      description: "",
    });
    setError("");
    setShowForm(false);
  }

  return (
    <WorkspaceLayout>
      <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
        <PageHeader
          eyebrow="Your opportunities"
          title="Jobs"
          description="Organize the opportunities you want to pursue."
          action={
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Job
            </button>
          }
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Summary
            label="Saved Jobs"
            value={jobs.length}
            icon={<BriefcaseBusiness size={20} />}
          />

          <Summary
            label="Full-time Roles"
            value={
              jobs.filter((job) => job.employmentType === "Full-time").length
            }
            icon={<Building2 size={20} />}
          />

          <Summary
            label="Remote Opportunities"
            value={
              jobs.filter((job) =>
                job.location.toLowerCase().includes("remote"),
              ).length
            }
            icon={<MapPin size={20} />}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={19} className="text-slate-500" />
            <h2 className="font-semibold text-slate-900">
              Find opportunities
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search company, role, location..."
                className="w-full min-w-0 bg-transparent text-sm outline-none"
              />
            </label>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Filter by employment type"
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              {employmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              aria-label="Filter by location"
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredJobs.length}
            </span>{" "}
            of {jobs.length} saved jobs
          </p>
        </section>

        <section className="space-y-4">
          {filteredJobs.map((job) => (
            <article
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm sm:p-6"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Building2 size={23} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-900">
                      {job.position}
                    </h2>
                    <p className="mt-1 font-medium text-slate-600">
                      {job.company}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={15} />
                        {job.location}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Clock3 size={15} />
                        {job.employmentType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Saved
                  </span>

                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    {job.salary}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Added {job.dateAdded}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                {job.description}
              </p>
            </article>
          ))}

          {filteredJobs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <BriefcaseBusiness
                size={32}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-semibold text-slate-800">
                No jobs found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("All types");
                  setLocationFilter("All locations");
                }}
                className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-job-title"
            className="my-4 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="add-job-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Add a job
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Record an opportunity you want to track.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close form"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddJob} className="mt-6 space-y-4">
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

                <FormField label="Employment type">
                  <select
                    value={form.employmentType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        employmentType: event.target.value,
                      })
                    }
                    className="form-input"
                  >
                    {employmentTypes.slice(1).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Salary (optional)">
                <input
                  value={form.salary}
                  onChange={(event) =>
                    setForm({ ...form, salary: event.target.value })
                  }
                  placeholder="e.g. ₱30,000–₱40,000 / month"
                  className="form-input"
                />
              </FormField>

              <FormField label="Job description (optional)">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Add a short description..."
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
                  Save Job
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
    </WorkspaceLayout>
  );
}

function Summary({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
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