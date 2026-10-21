"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Video,
  MapPin,
  Plus,
  Search,
  X,
  CheckCircle2,
  CalendarCheck,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";

type InterviewStatus = "Scheduled" | "Completed" | "Cancelled";
type InterviewType = "Video" | "Phone" | "On-site";

type Interview = {
  id: number;
  company: string;
  position: string;
  date: string;
  time: string;
  type: InterviewType;
  location: string;
  status: InterviewStatus;
  notes: string;
};

const initialInterviews: Interview[] = [
  {
    id: 1,
    company: "Microsoft",
    position: "Frontend Developer",
    date: "2026-10-13",
    time: "10:00",
    type: "Video",
    location: "Microsoft Teams",
    status: "Scheduled",
    notes: "Prepare portfolio and React projects.",
  },
  {
    id: 2,
    company: "Google",
    position: "Junior Software Engineer",
    date: "2026-10-15",
    time: "14:00",
    type: "Video",
    location: "Google Meet",
    status: "Scheduled",
    notes: "Review data structures and algorithms.",
  },
  {
    id: 3,
    company: "Accenture",
    position: "Associate Software Engineer",
    date: "2026-10-08",
    time: "09:30",
    type: "Phone",
    location: "Phone call",
    status: "Completed",
    notes: "Initial HR screening.",
  },
];

const emptyForm = {
  company: "",
  position: "",
  date: "",
  time: "",
  type: "Video" as InterviewType,
  location: "",
  status: "Scheduled" as InterviewStatus,
  notes: "",
};

function formatDate(date: string) {
  if (!date) return "Not set";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string) {
  if (!time) return "Not set";

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InterviewsPage() {
  const [interviews, setInterviews] =
    useState<Interview[]>(initialInterviews);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const today = new Date().toLocaleDateString("en-CA");

  const upcomingCount = interviews.filter(
    (interview) =>
      interview.status === "Scheduled" && interview.date >= today,
  ).length;

  const completedCount = interviews.filter(
    (interview) => interview.status === "Completed",
  ).length;

  const scheduledCount = interviews.filter(
    (interview) => interview.status === "Scheduled",
  ).length;

  const filteredInterviews = useMemo(() => {
    return interviews
      .filter((interview) => {
        const searchText =
          `${interview.company} ${interview.position} ${interview.location}`.toLowerCase();

        const matchesSearch = searchText.includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "All" || interview.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      );
  }, [interviews, search, statusFilter]);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(interview: Interview) {
    setEditingId(interview.id);
    setForm({
      company: interview.company,
      position: interview.position,
      date: interview.date,
      time: interview.time,
      type: interview.type,
      location: interview.location,
      status: interview.status,
      notes: interview.notes,
    });
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const company = form.company.trim();
    const position = form.position.trim();

    if (!company || !position) {
      window.alert("Company and position are required and cannot contain only spaces.");
      return;
    }

    const interviewData = {
      ...form,
      company,
      position,
      location: form.location.trim(),
      notes: form.notes.trim(),
    };

    if (editingId !== null) {
      setInterviews((current) =>
        current.map((interview) =>
          interview.id === editingId
            ? { ...interview, ...interviewData }
            : interview,
        ),
      );
    } else {
      const newInterview: Interview = {
        id: Date.now(),
        ...interviewData,
      };

      setInterviews((current) => [...current, newInterview]);
    }

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function updateStatus(id: number, status: InterviewStatus) {
    setInterviews((current) =>
      current.map((interview) =>
        interview.id === id ? { ...interview, status } : interview,
      ),
    );
  }

  function deleteInterview(id: number) {
    if (window.confirm("Are you sure you want to delete this interview?")) {
      setInterviews((current) =>
        current.filter((interview) => interview.id !== id),
      );
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <WorkspaceLayout>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
        <PageHeader
          eyebrow="Your schedule"
          title="Interviews"
          description="Keep track of your upcoming interviews and interview history."
          action={
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Interview
            </button>
          }
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Interviews",
              value: interviews.length,
              icon: CalendarDays,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Upcoming",
              value: upcomingCount,
              icon: Clock,
              color: "bg-amber-50 text-amber-600",
            },
            {
              label: "Completed",
              value: completedCount,
              icon: CheckCircle2,
              color: "bg-green-50 text-green-600",
            },
            {
              label: "Scheduled",
              value: scheduledCount,
              icon: CalendarCheck,
              color: "bg-purple-50 text-purple-600",
            },
          ].map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
                  >
                    <Icon size={20} />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Interview Schedule
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage dates, details, and interview status.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search interviews..."
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-56"
                />
              </div>

              <select
                aria-label="Filter interviews by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="All">All statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredInterviews.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarDays
                  size={36}
                  className="mx-auto text-gray-300"
                />
                <p className="mt-3 font-medium text-gray-700">
                  No interviews found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Try another search or add a new interview.
                </p>
              </div>
            ) : (
              filteredInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-gray-50/70 xl:flex-row xl:items-center xl:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      {interview.type === "Video" ? (
                        <Video size={22} />
                      ) : interview.type === "Phone" ? (
                        <Clock size={22} />
                      ) : (
                        <MapPin size={22} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {interview.position}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            interview.status === "Scheduled"
                              ? "bg-blue-50 text-blue-700"
                              : interview.status === "Completed"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                          }`}
                        >
                          {interview.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm font-medium text-gray-600">
                        {interview.company}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={15} />
                          {formatDate(interview.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={15} />
                          {formatTime(interview.time)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {interview.type === "Video" ? (
                            <Video size={15} />
                          ) : interview.type === "Phone" ? (
                            <Clock size={15} />
                          ) : (
                            <MapPin size={15} />
                          )}
                          {interview.type}
                        </span>
                      </div>

                      {interview.location && (
                        <p className="mt-2 text-xs text-gray-500">
                          Location / meeting details: {interview.location}
                        </p>
                      )}

                      {interview.notes && (
                        <p className="mt-1 text-xs text-gray-500">
                          Notes: {interview.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <select
                      aria-label={`Change status for ${interview.company} interview`}
                      value={interview.status}
                      onChange={(e) =>
                        updateStatus(
                          interview.id,
                          e.target.value as InterviewStatus,
                        )
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => openEditModal(interview)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteInterview(interview.id)}
                      aria-label={`Delete ${interview.company} interview`}
                      title="Delete interview"
                      className="rounded-lg border border-red-200 p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-500">
            Showing {filteredInterviews.length} of {interviews.length} interviews
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId !== null ? "Edit Interview" : "Add Interview"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the details of your interview.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Company *
                  </label>
                  <input
                    required
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                    placeholder="e.g. Google"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Position *
                  </label>
                  <input
                    required
                    value={form.position}
                    onChange={(e) =>
                      setForm({ ...form, position: e.target.value })
                    }
                    placeholder="e.g. Software Engineer"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Interview Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Interview Time *
                  </label>
                  <input
                    required
                    type="time"
                    value={form.time}
                    onChange={(e) =>
                      setForm({ ...form, time: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Interview Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as InterviewType,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="Video">Video</option>
                    <option value="Phone">Phone</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as InterviewStatus,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">
                    Location or Meeting Link
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    placeholder="e.g. Google Meet link or office address"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    placeholder="Preparation notes or interview feedback..."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editingId !== null ? "Save Changes" : "Add Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}