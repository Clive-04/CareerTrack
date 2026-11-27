import { expect, test, type Page, type Route } from "@playwright/test";

const user = {
  id: "user-1",
  email: "clive@example.com",
  first_name: "Clive",
  last_name: "Tester",
};

const jobDescription = "Build accessible web interfaces for customers using React and TypeScript. Collaborate with designers and backend engineers to deliver reliable features, review code, document decisions, and improve automated tests. The role requires clear communication, responsive design experience, version control knowledge, API integration skills, practical debugging, and careful attention to usability, performance, security, and maintainable frontend architecture.";

async function mockCareerTrackApi(page: Page) {
  let authenticated = false;
  const session = { user, csrf_token: "e2e-csrf-token" };
  const handleApiRoute = async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api-test/, "");
    const method = request.method();
    const corsHeaders = {
      "Access-Control-Allow-Headers": "Authorization, Content-Type, X-CSRF-Token",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Origin": "http://localhost:3000",
      "Access-Control-Allow-Credentials": "true",
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
      authenticated = true;
      await fulfillJson(session);
      return;
    }

    if (method === "POST" && path === "/auth/register") {
      await fulfillJson(user, 201);
      return;
    }

    if (method === "GET" && path === "/auth/me") {
      await fulfillJson(authenticated ? session : { detail: "Authentication required" }, authenticated ? 200 : 401);
      return;
    }

    if (method === "POST" && path === "/auth/logout") {
      authenticated = false;
      await route.fulfill({ status: 204, headers: corsHeaders });
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
          description: jobDescription,
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

    if (method === "GET" && path === "/jobs/job-1/analyses") {
      await fulfillJson([]);
      return;
    }

    if (method === "POST" && path === "/jobs/job-1/analysis-preview") {
      await fulfillJson({
        resume_text: "Frontend developer with React and TypeScript experience building accessible interfaces and integrating reliable APIs for customer-facing products.",
        skills_context: "- React (category: Frameworks; proficiency: Advanced; experience: 3 years; notes: Built reusable accessible components.)",
        job_description: jobDescription,
      });
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

const TAB_BAR_LINKS = ["Overview", "Jobs", "Applications", "Interviews"];

// The Next.js development indicator floats over the bottom tab bar on phones.
// It does not exist in production builds, so hide it during tests.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal { display: none !important; }";
      document.head.append(style);
    });
  });
});

function isPhone(page: Page) {
  return (page.viewportSize()?.width ?? 1280) < 768;
}

async function followWorkspaceLink(page: Page, name: string) {
  const nav = page.getByRole("navigation", { name: "Workspace" });
  if (isPhone(page) && !TAB_BAR_LINKS.includes(name)) {
    await nav.getByRole("button", { name: "More" }).click();
    await page.getByRole("dialog", { name: "More" }).getByRole("link", { name }).click();
    return;
  }
  await nav.getByRole("link", { name, exact: true }).click();
}

async function openAccountMenu(page: Page) {
  await page.getByRole("button", { name: "Account: Clive Tester" }).click();
  return page.getByRole("menu", { name: "Account: Clive Tester" });
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("clive@example.com");
  await page.getByLabel("Password", { exact: true }).fill("correct-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("keeps the landing page public and protects the dashboard", async ({ page }) => {
  const response = await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Organize your job search/ })).toBeVisible();
  await page.getByRole("link", { name: "Create account", exact: true }).first().click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByRole("link", { name: "Create an account", exact: true }).click();
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
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
});

test("navigates every workspace page without horizontal overflow", async ({ page }) => {
  await mockCareerTrackApi(page);
  await signIn(page);

  const pages = [
    ["Jobs", "/jobs", "Jobs"],
    ["Applications", "/applications", "Applications"],
    ["Interviews", "/interviews", "Interviews"],
    ["Resumes", "/resumes", "Resumes"],
    ["Skills", "/skills", "Skills"],
    ["Overview", "/dashboard", "Overview"],
  ] as const;

  for (const [link, path, heading] of pages) {
    await followWorkspaceLink(page, link);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible();
    const currentControl = isPhone(page) && !TAB_BAR_LINKS.includes(link)
      ? page.getByRole("navigation", { name: "Workspace" }).getByRole("button", { name: "More" })
      : page.getByRole("navigation", { name: "Workspace" }).getByRole("link", { name: link, exact: true });
    await expect(currentControl).toHaveAttribute("aria-current", "page");
    await expect.poll(() => page.evaluate(() =>
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    )).toBe(true);
  }

  await page.goto("/applications?job=job-1&resume=resume-1");
  const applicationDialog = page.getByRole("dialog", { name: "Track application" });
  await expect(applicationDialog).toBeVisible();
  await expect(applicationDialog.getByLabel("Job")).toHaveValue("job-1");
  await expect(applicationDialog.getByLabel("Resume used")).toHaveValue("resume-1");
  await expect(page).toHaveURL(/\/applications$/);
});

test("shows every application status faithfully", async ({ page }) => {
  await mockCareerTrackApi(page);
  await signIn(page);
  await followWorkspaceLink(page, "Applications");

  // The mocked application is INTERVIEW; it must not be collapsed or renamed.
  const row = page.getByRole("article", { name: "Frontend Developer" });
  await expect(row.locator(".career-track-stop[data-state='current']")).toHaveAttribute("title", "Interview");
  const statusSelect = row.getByLabel(/Status for Frontend Developer/);
  await expect(statusSelect).toHaveValue("Interview");
  await expect(statusSelect.locator("option")).toHaveText([
    "Saved", "Applied", "Assessment", "Interview", "Final interview", "Offer", "Rejected", "Withdrawn",
  ]);
});

test("keeps keyboard focus inside dialogs and menus", async ({ page }) => {
  await mockCareerTrackApi(page);
  await signIn(page);
  await followWorkspaceLink(page, "Jobs");

  await page.getByRole("button", { name: "Add job" }).click();
  const jobDialog = page.getByRole("dialog", { name: "Add job" });
  await expect(jobDialog.getByLabel("Company")).toBeFocused();
  for (let index = 0; index < 25; index += 1) {
    await page.keyboard.press("Tab");
    const focusInside = await jobDialog.evaluate((dialog) => dialog.contains(document.activeElement));
    expect(focusInside).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(jobDialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Add job" })).toBeFocused();

  await page.getByRole("button", { name: /Frontend Developer/ }).first().click();
  const menuButton = page.getByRole("button", { name: "More actions for Frontend Developer at Example Company" });
  await menuButton.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu", { name: "More actions for Frontend Developer at Example Company" });
  await expect(menu.getByRole("menuitem", { name: "Analysis history" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Edit job" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(menuButton).toBeFocused();
});

test("signs in, loads dashboard data, and confirms logout", async ({ page }) => {
  await mockCareerTrackApi(page);
  await signIn(page);

  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
  await expect(page.getByText("Frontend Developer", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Next steps" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Where things stand" })).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);

  await followWorkspaceLink(page, "Jobs");
  const jobSearch = page.getByLabel("Search jobs");
  await jobSearch.focus();
  await expect(jobSearch.locator("..")).not.toHaveCSS("box-shadow", "none");
  await expect(jobSearch).toHaveCSS("box-shadow", "none");
  await page.getByRole("button", { name: "Add job" }).click();
  const jobDialog = page.getByRole("dialog", { name: "Add job" });
  await expect(jobDialog).toBeVisible();

  const backdropBox = await jobDialog.locator("..").boundingBox();
  const viewport = page.viewportSize();
  expect(backdropBox).not.toBeNull();
  expect(Math.round(backdropBox?.x ?? -1)).toBe(0);
  expect(Math.round(backdropBox?.y ?? -1)).toBe(0);
  expect(Math.round(backdropBox?.width ?? -1)).toBe(viewport?.width);
  expect(Math.round(backdropBox?.height ?? -1)).toBe(viewport?.height);
  await page.keyboard.press("Escape");
  await expect(jobDialog).toBeHidden();

  const jobRow = page.getByRole("button", { name: /Frontend Developer/ }).first();
  await expect(jobRow).toContainText("Resume match 88/100");
  await jobRow.click();
  await page.getByRole("button", { name: "Compare again" }).click();
  const analysisDialog = page.getByRole("dialog", { name: "Resume match" });
  await expect(analysisDialog).toBeVisible();
  await analysisDialog.getByRole("button", { name: "Review text before sending" }).click();
  await expect(analysisDialog.getByRole("tab", { name: "Resume" })).toHaveAttribute("aria-selected", "true");
  await analysisDialog.getByRole("tab", { name: "Skills" }).click();
  await expect(analysisDialog.getByLabel("Selected skills context")).toHaveValue(/React/);
  await analysisDialog.getByRole("tab", { name: "Job" }).click();
  await expect(analysisDialog.getByLabel("Job requirements")).toHaveValue(/accessible web interfaces/);
  await analysisDialog.getByRole("button", { name: "Close analysis" }).click();
  await expect(analysisDialog).toBeHidden();

  await followWorkspaceLink(page, "Interviews");
  await expect(page.getByRole("heading", { name: "Ready to schedule" })).toBeVisible();
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  const interviewDialog = page.getByRole("dialog", { name: "Schedule interview" });
  await expect(interviewDialog.getByLabel("Application")).toHaveValue("application-1");
  await page.keyboard.press("Escape");
  await expect(interviewDialog).toBeHidden();

  await (await openAccountMenu(page)).getByRole("menuitem", { name: "Log out" }).click();
  const dialog = page.getByRole("dialog", { name: "Log out of CareerTrack?" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();

  await (await openAccountMenu(page)).getByRole("menuitem", { name: "Log out" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Organize your job search/ })).toBeVisible();
});

test("plays the route entrance once and respects reduced motion", async ({ page }) => {
  await mockCareerTrackApi(page);
  await signIn(page);

  const entrance = page.locator("[data-entrance]");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("careertrack:entered:/dashboard"))).toBe("1");
  await followWorkspaceLink(page, "Jobs");
  await followWorkspaceLink(page, "Overview");
  await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
  await expect(entrance).toHaveAttribute("data-entrance", "off");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const header = page.locator("header.app-enter").first();
  await expect(header).toBeVisible();
  const duration = await header.evaluate((element) => getComputedStyle(element).animationDuration);
  expect(parseFloat(duration)).toBeLessThan(0.01);
});
