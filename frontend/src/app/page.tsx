"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import BrandLogo from "@/components/BrandLogo";
import { CareerTrack, StatusChip } from "@/components/CareerTrack";
import type { ApplicationStatus } from "@/lib/applicationStatus";

const exampleApplications: { position: string; company: string; status: ApplicationStatus; note: string }[] = [
  { position: "Frontend Developer", company: "Example Studio", status: "Final interview", note: "Panel on Thursday, 10:00" },
  { position: "Associate Software Engineer", company: "Sample Systems", status: "Assessment", note: "Take-home due Friday" },
  { position: "UI Developer", company: "Demo Labs", status: "Applied", note: "Resume match 82/100" },
];

const features = [
  {
    title: "Saved jobs with the full posting",
    description: "Keep the description, salary, and link together, so you can still read the original requirements after the listing closes.",
  },
  {
    title: "Applications that move by stage",
    description: "Saved, applied, assessment, interview, final interview, offer. Change the stage in one step and see where everything stands.",
  },
  {
    title: "Resume analysis on request",
    description: "Compare a resume with a saved job using Gemini. You’ll see the match, the gaps, and when an analysis is out of date.",
  },
  {
    title: "Interviews in one schedule",
    description: "Dates, formats, meeting links, and notes for each conversation, next to the application they belong to.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [isLoading, router, user]);

  // The landing page is public, so it renders while the session check runs.
  // Signed-in visitors are redirected to their workspace.
  if (user) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center p-6">
        <div role="status" className="app-loading-state">
          <span className="app-spinner" aria-hidden="true" />
          Opening your workspace…
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-slate-800">
      <a href="#landing-content" className="app-skip-link">Skip to main content</a>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="CareerTrack home">
            <BrandLogo className="h-8 w-8" priority />
            <span className="text-lg font-semibold text-slate-900">CareerTrack</span>
          </Link>
          <nav aria-label="Account" className="flex items-center gap-2">
            <Link href="/login" className="app-button-ghost app-button-compact">Sign in</Link>
            <Link href="/register" aria-label="Create account" className="app-button-primary app-button-compact">
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <main id="landing-content" tabIndex={-1} className="outline-none">
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:py-20">
          <div>
            <h1 className="font-display max-w-xl text-[2.5rem] leading-[1.1] text-slate-900 sm:text-[3.25rem]">
              Organize your job search, one stage at a time.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              CareerTrack is a private workspace for the roles you’re pursuing, the applications you’ve sent, your resumes, and your interviews.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="app-button-primary !min-h-12 !px-6 !text-base">Create a free account</Link>
              <Link href="/login" className="app-button-secondary !min-h-12 !px-6 !text-base">Sign in</Link>
            </div>
          </div>

          {/* Illustrative example of the applications view, built from the real components. */}
          <figure className="app-surface overflow-hidden">
            <figcaption className="flex items-center justify-between border-b border-slate-200 px-5 py-3 text-sm">
              <span className="font-semibold text-slate-900">Applications</span>
              <span className="text-slate-500">Example</span>
            </figcaption>
            <ul className="divide-y divide-slate-200">
              {exampleApplications.map((application) => (
                <li key={application.position} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{application.position}</p>
                    <p className="truncate text-sm text-slate-500">{application.company} · {application.note}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <StatusChip status={application.status} />
                    <CareerTrack status={application.status} className="w-full" />
                  </div>
                </li>
              ))}
            </ul>
          </figure>
        </section>

        <section aria-labelledby="features-title" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 id="features-title" className="font-display max-w-xl text-[1.75rem] leading-tight text-slate-900 sm:text-[2.125rem]">
              What you can keep track of
            </h2>
            <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="border-l-2 border-cyan-600 pl-5">
                  <dt className="text-[1.1875rem] font-semibold text-slate-900">{feature.title}</dt>
                  <dd className="mt-2 max-w-[60ch] leading-7 text-slate-600">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="privacy-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <h2 id="privacy-title" className="font-display text-[1.75rem] leading-tight text-slate-900 sm:text-[2.125rem]">
              Private to your account
            </h2>
            <div className="space-y-4 leading-7 text-slate-600">
              <p>
                CareerTrack is a personal tracker, not a job board. Your jobs, applications, resumes, and interviews are visible only to you when you’re signed in.
              </p>
              <p>
                Resume text is sent to Gemini only when you start an analysis. Uploaded files are stored privately and can be deleted at any time.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="flex items-center gap-2"><BrandLogo className="h-5 w-5" /> CareerTrack</span>
          <Link href="/register" className="app-button-text">Create a free account</Link>
        </div>
      </footer>
    </div>
  );
}
