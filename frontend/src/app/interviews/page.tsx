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
  CalendarPlus,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { useApplications } from "@/components/ApplicationsProvider";
import {
  useInterviews,
  type Interview,
  type InterviewStatus,
  type InterviewType,
} from "@/components/InterviewsProvider";
import useDialogControls from "@/hooks/useDialogControls";

const emptyForm = {
  applicationId: "",
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
  const {
    interviews,
    createInterview,
    updateInterview,
    updateInterviewStatus,
    deleteInterview,
    isLoading: interviewsLoading,
    error: interviewsError,
  } = useInterviews();
  const { applications, isLoading: applicationsLoading } = useApplications();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [interviewToDelete, setInterviewToDelete] = useState<Interview | null>(
    null,
  );

  useDialogControls(showModal, closeModal);
  useDialogControls(interviewToDelete !== null, () => setInterviewToDelete(null));

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

  const applicationsReadyToSchedule = useMemo(() => {
    const applicationsWithInterviews = new Set(
      interviews.map((interview) => interview.applicationId),
    );

    return applications.filter(
      (application) =>
        application.status === "Interview" &&
        !applicationsWithInterviews.has(application.id),
    );
  }, [applications, interviews]);

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

  function openAddModal(applicationId?: string) {
    setError("");
    setEditingId(null);
    setForm({
      ...emptyForm,
      applicationId: applicationId ?? applications[0]?.id ?? "",
    });
    setShowModal(true);
  }

  function openEditModal(interview: Interview) {
    setError("");
    setEditingId(interview.id);
    setForm({
      applicationId: interview.applicationId,
      date: interview.date,
      time: interview.time,
      type: interview.type,
      location: interview.location,
      status: interview.status,
      notes: interview.notes,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.applicationId) {
      setError("Select an application before scheduling an interview.");
      return;
    }

    if (!form.date || !form.time) {
      setError("Interview date and time are required.");
      return;
    }

    const interviewData = {
      applicationId: form.applicationId,
      date: form.date,
      time: form.time,
      type: form.type,
      status: form.status,
      location: form.location.trim(),
      notes: form.notes.trim(),
    };

    try {
      setError("");
      if (editingId !== null) {
        await updateInterview(editingId, interviewData);
      } else {
        await createInterview(interviewData);
      }
      closeModal();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save interview.",
      );
    }
  }

  async function updateStatus(id: string, status: InterviewStatus) {
    try {
      await updateInterviewStatus(id, status);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update interview status.",
      );
    }
  }

  async function confirmDeleteInterview() {
    if (!interviewToDelete) return;

    try {
      await deleteInterview(interviewToDelete.id);
      setInterviewToDelete(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete interview.",
      );
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

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
              onClick={() => openAddModal()}
              className="app-button-primary self-start"
            >
              <Plus size={18} />
              Add Interview
            </button>
          }
        />

        {(interviewsLoading || applicationsLoading) && (
          <div role="status" className="app-loading-state"><span className="app-spinner" aria-hidden="true" />Loading interviews...</div>
        )}
        {interviewsError && (
          <p role="alert" className="text-sm text-red-600">
            {interviewsError}
          </p>
        )}

        {applicationsReadyToSchedule.length > 0 && (
          <section className="app-surface overflow-hidden border-indigo-100 bg-gradient-to-r from-white to-indigo-50/60">
            <div className="flex flex-col gap-3 border-b border-indigo-100/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <CalendarPlus size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Applications ready to schedule</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    These applications have reached the interview stage but still need interview details.
                  </p>
                </div>
              </div>
              <span className="self-start rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 sm:self-auto">
                {applicationsReadyToSchedule.length} pending
              </span>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {applicationsReadyToSchedule.map((application) => (
                <div key={application.id} className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
                  <p className="font-semibold text-slate-900">{application.position}</p>
                  <p className="mt-1 text-sm text-slate-500">{application.company}</p>
                  <button
                    type="button"
                    onClick={() => openAddModal(application.id)}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
                  >
                    <CalendarPlus size={16} />
                    Schedule interview
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

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
                className="app-surface app-surface-interactive p-5"
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

        <section className="app-surface overflow-hidden">
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
                  aria-label="Search interviews"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search interviews..."
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 sm:w-56"
                />
              </div>

              <select
                aria-label="Filter interviews by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
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
              <div className="app-empty-state m-5">
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
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
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
                      onClick={() => setInterviewToDelete(interview)}
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
        <div className="app-modal-backdrop app-modal-backdrop-scroll">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="interview-form-title"
            className="app-modal-panel my-auto max-w-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 id="interview-form-title" className="text-lg font-bold text-gray-900">
                  {editingId !== null ? "Edit Interview" : "Add Interview"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the details of your interview.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form
              noValidate
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Application *
                  </label>
                  <select
                    required
                    disabled={editingId !== null}
                    value={form.applicationId}
                    onChange={(e) =>
                      setForm({ ...form, applicationId: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">
                      {applications.length === 0
                        ? "No applications available"
                        : "Select an application"}
                    </option>
                    {applications.map((application) => (
                      <option key={application.id} value={application.id}>
                        {application.company} — {application.position}
                      </option>
                    ))}
                  </select>
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

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              {applications.length === 0 && (
                <p className="text-sm text-amber-700">
                  Create an application before scheduling an interview.
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="app-button-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="app-button-primary"
                >
                  {editingId !== null ? "Save Changes" : "Add Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {interviewToDelete && (
        <div className="app-modal-backdrop !z-[80]">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-interview-title" aria-describedby="delete-interview-description" className="app-modal-panel max-w-md p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>
            <h2 id="delete-interview-title" className="mt-4 text-lg font-bold text-gray-900">
              Delete interview?
            </h2>
            <p id="delete-interview-description" className="mt-2 text-sm text-gray-500">
              This will permanently remove the interview for {" "}
              <span className="font-medium text-gray-700">
                {interviewToDelete.company}
              </span>
              .
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setInterviewToDelete(null)}
                className="app-button-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteInterview}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete interview
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
