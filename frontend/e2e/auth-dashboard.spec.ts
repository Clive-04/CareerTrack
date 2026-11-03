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

    if (method === "POST" && path === "/auth/register") {
      await fulfillJson(user, 201);
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
          status: "INTERVIEW",
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

test("keeps the landing page public and protects the dashboard", async ({ page }) => {
  const response = await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Organize your job search/ })).toBeVisible();
  await page.getByRole("link", { name: "Create account", exact: true }).first().click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.locator(".auth-mode-enter-forward")).toBeVisible();
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.locator(".auth-mode-enter-back")).toBeVisible();
  await page.getByRole("link", { name: "Create one", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.getByLabel("First name")).toBeVisible();
  await expect(page.getByLabel("Last name")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Confirm password")).toBeVisible();

  await page.getByLabel("First name").fill("Clive");
  await page.getByLabel("Last name").fill("Tester");
  await page.getByLabel("Email").fill("clive@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Correct-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Please confirm your password.", { exact: true })).toBeVisible();

  await page.getByLabel("Confirm password").fill("different-password");
  await expect(page.getByLabel("Passwords do not match", { exact: true })).toBeVisible();
  await expect(page.getByText("Passwords do not match.", { exact: true })).toBeVisible();
  await page.getByLabel("Confirm password").fill("Correct-password");
  await expect(page.getByLabel("Passwords match", { exact: true })).toBeVisible();
  await expect(page.getByText("Passwords match.", { exact: true })).toBeVisible();

  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
});

test("registers a new user through the dedicated registration page", async ({ page }) => {
  await mockCareerTrackApi(page);
  await page.goto("/register");

  await page.getByLabel("First name").fill("Clive");
  await page.getByLabel("Last name").fill("Tester");
  await page.getByLabel("Email").fill("clive@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Correct-password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByLabel("Confirm password").fill("Correct-password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();
});

test("signs in, loads dashboard data, and confirms logout", async ({ page }) => {
  await mockCareerTrackApi(page);
  await page.goto("/login");

  await page.getByLabel("Email").fill("clive@example.com");
  await page.getByLabel("Password", { exact: true }).fill("correct-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Welcome back!" })).toBeVisible();
  await expect(page.getByText("Frontend Developer", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("88/100")).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("complementary").getByRole("link", { name: "Saved Jobs" }).click();
  await page.getByRole("button", { name: "Save Job" }).click();
  const jobDialog = page.getByRole("dialog", { name: "Save a job" });
  await expect(jobDialog).toBeVisible();

  const backdropBox = await jobDialog.locator("..").boundingBox();
  const viewport = page.viewportSize();
  expect(backdropBox).not.toBeNull();
  expect(Math.round(backdropBox?.x ?? -1)).toBe(0);
  expect(Math.round(backdropBox?.y ?? -1)).toBe(0);
  expect(Math.round(backdropBox?.width ?? -1)).toBe(viewport?.width);
  expect(Math.round(backdropBox?.height ?? -1)).toBe(viewport?.height);
  await jobDialog.getByRole("button", { name: "Close form" }).click();

  await page.getByRole("complementary").getByRole("link", { name: "Interviews" }).click();
  await expect(page.getByRole("heading", { name: "Applications ready to schedule" })).toBeVisible();
  await page.getByRole("button", { name: "Schedule interview" }).click();
  const interviewDialog = page.getByRole("dialog", { name: "Add Interview" });
  await expect(interviewDialog.locator("select").first()).toHaveValue("application-1");
  await interviewDialog.getByRole("button", { name: "Close form" }).click();

  const logoutButton = page.getByRole("complementary").getByRole("button", { name: "Log out" });
  await logoutButton.click();
  const dialog = page.getByRole("dialog", { name: "Log out of CareerTrack?" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();

  await logoutButton.click();
  await page.getByRole("dialog").getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Organize your job search/ })).toBeVisible();
});
