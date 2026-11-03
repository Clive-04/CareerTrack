import { expect, test, type Page, type Route } from "@playwright/test";

const user = {
  id: "user-1",
  email: "clive@example.com",
  first_name: "Clive",
  last_name: "Tester",
};

async function mockCareerTrackApi(page: Page) {
  const handleApiRoute = async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api-test/, "");
    const method = request.method();
    const corsHeaders = {
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Origin": "*",
    };
    const fulfillJson = (json: unknown, status = 200) => route.fulfill({
      status,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify(json),
    });

    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (method === "POST" && path === "/auth/login") {
      await fulfillJson({ access_token: "e2e-token", token_type: "bearer" });
      return;
    }

    if (method === "GET" && path === "/auth/me") {
      await fulfillJson(user);
      return;
    }

    if (method === "GET" && path === "/jobs") {
      await fulfillJson([{
          id: "job-1",
          company: "Example Company",
          position: "Frontend Developer",
          location: "Remote",
          employment_type: "Full-time",
          job_url: null,
          description: "Build accessible web interfaces for customers.",
          salary_min: 50_000,
          salary_max: 70_000,
          created_at: "2026-11-01T08:00:00Z",
          latest_analysis_score: 88,
          latest_analysis_resume_id: "resume-1",
          latest_analysis_created_at: "2026-11-02T08:00:00Z",
          latest_analysis_is_stale: false,
          latest_analysis_stale_reasons: [],
        }]);
      return;
    }

    if (method === "GET" && path === "/resumes") {
      await fulfillJson([{
          id: "resume-1",
          extraction_status: "ready",
          has_file: true,
          name: "Frontend Resume",
          target_role: "Frontend Developer",
          file_name: "resume.pdf",
          file_path: "resume.pdf",
          parsed_text: "Frontend developer with React experience.",
          skills: ["React", "TypeScript"],
          notes: "",
          is_default: true,
          created_at: "2026-11-01T08:00:00Z",
          updated_at: "2026-11-02T08:00:00Z",
        }]);
      return;
    }

    if (method === "GET" && path === "/applications") {
      await fulfillJson([{
          id: "application-1",
          job_id: "job-1",
          resume_id: "resume-1",
          status: "APPLIED",
          date_applied: "2026-11-03",
          notes: "Submitted online",
        }]);
      return;
    }

    if (method === "GET" && ["/interviews", "/skills"].includes(path)) {
      await fulfillJson([]);
      return;
    }

    await fulfillJson({ detail: `Unhandled E2E API request: ${method} ${path}` }, 404);
  };

  await page.route("**/api-test/**", handleApiRoute);
  await page.route("http://localhost:8000/**", handleApiRoute);
  await page.route("http://127.0.0.1:8000/**", handleApiRoute);
}

test("redirects signed-out users to login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("signs in, loads dashboard data, and confirms logout", async ({ page }) => {
  await mockCareerTrackApi(page);
  await page.goto("/login");

  await page.getByLabel("Email").fill("clive@example.com");
  await page.getByLabel("Password").fill("correct-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();
  await expect(page.getByText("Frontend Developer", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("88/100")).toBeVisible();

  const logoutButton = page.getByRole("complementary").getByRole("button", { name: "Log out" });
  await logoutButton.click();
  const dialog = page.getByRole("dialog", { name: "Log out of CareerTrack?" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();

  await logoutButton.click();
  await page.getByRole("dialog").getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
