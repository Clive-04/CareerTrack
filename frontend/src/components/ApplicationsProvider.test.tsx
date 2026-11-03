import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ApplicationsProvider, { useApplications } from "@/components/ApplicationsProvider";

const api = vi.hoisted(() => ({
  getApplications: vi.fn().mockResolvedValue([]),
  createApplication: vi.fn().mockResolvedValue({
    id: "application-1",
    job_id: "job-1",
    resume_id: "resume-1",
    status: "APPLIED",
    date_applied: "2026-11-03",
    notes: "Submitted online",
  }),
  updateApplication: vi.fn(),
  deleteApplication: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(),
  getApplications: api.getApplications,
  createApplication: api.createApplication,
  updateApplication: api.updateApplication,
  deleteApplication: api.deleteApplication,
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ token: "test-token", isLoading: false }),
}));

vi.mock("@/components/JobsProvider", () => {
  const jobs = [{ id: "job-1", company: "Example", position: "Developer", location: "Remote" }];

  return {
    useJobs: () => ({ jobs, isLoading: false }),
  };
});

vi.mock("@/components/ResumesProvider", () => {
  const resumes = [{ id: "resume-1", name: "Main Resume" }];

  return {
    useResumes: () => ({ resumes, isLoading: false }),
  };
});

function Consumer() {
  const { applications, createApplication } = useApplications();

  return (
    <div>
      <button
        type="button"
        onClick={() => void createApplication({
          jobId: "job-1",
          resumeId: "resume-1",
          dateApplied: "2026-11-03",
          status: "Applied",
          notes: "Submitted online",
        })}
      >
        Create application
      </button>
      {applications.map((application) => (
        <p key={application.id}>{application.company} - {application.resumeName}</p>
      ))}
    </div>
  );
}

describe("ApplicationsProvider", () => {
  it("sends the selected resume and maps it into application state", async () => {
    render(<ApplicationsProvider><Consumer /></ApplicationsProvider>);
    await waitFor(() => expect(api.getApplications).toHaveBeenCalledWith("test-token"));

    fireEvent.click(screen.getByRole("button", { name: "Create application" }));

    await waitFor(() => expect(api.createApplication).toHaveBeenCalledWith("test-token", {
      job_id: "job-1",
      resume_id: "resume-1",
      status: "APPLIED",
      date_applied: "2026-11-03",
      notes: "Submitted online",
    }));
    expect(await screen.findByText("Example - Main Resume")).toBeInTheDocument();
  });
});
