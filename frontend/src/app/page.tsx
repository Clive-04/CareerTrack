"use client";

import Link from "next/link";
import { useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  FileSearch,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const features = [
  {
    icon: BriefcaseBusiness,
    title: "Save every opportunity",
    description: "Keep job details, links, salary information, and requirements together in one private workspace.",
    style: "bg-indigo-50 text-indigo-600",
    accent: "79 70 229",
    motion: "swing",
  },
  {
    icon: BarChart3,
    title: "Track your applications",
    description: "Follow each application from saved to applied, interview, offer, or rejection without losing context.",
    style: "bg-cyan-50 text-cyan-700",
    accent: "8 145 178",
    motion: "step",
  },
  {
    icon: FileSearch,
    title: "Compare with AI",
    description: "Use Gemini to compare your selected resume with a detailed job description and identify useful improvements.",
    style: "bg-violet-50 text-violet-600",
    accent: "124 58 237",
    motion: "spark",
  },
  {
    icon: CalendarCheck2,
    title: "Prepare for interviews",
    description: "Schedule interviews, record important details, and keep upcoming conversations visible.",
    style: "bg-emerald-50 text-emerald-600",
    accent: "5 150 105",
    motion: "check",
  },
];

const steps = [
  ["01", "Build your private profile", "Add your skills and keep multiple resumes organized for different career goals."],
  ["02", "Capture the opportunity", "Save a role with enough detail to make your application and AI comparison meaningful."],
  ["03", "Move forward with clarity", "Track your progress, review your match, and prepare for the next stage."],
];

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [isLoading, router, user]);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-landing-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  if (isLoading || user) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center p-6">
        <div className="app-surface flex items-center gap-3 px-5 py-4">
          <span className="app-spinner" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600">Opening your workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f9fc] text-slate-900">
      <a href="#landing-content" className="app-skip-link">Skip to main content</a>
      <header className="relative z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="CareerTrack home">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-200">
              <BriefcaseBusiness size={21} />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-cyan-400" />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-[-0.03em]">CareerTrack</span>
              <span className="block text-[10px] font-semibold tracking-[0.17em] text-slate-400">PRIVATE CAREER WORKSPACE</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex" aria-label="Public navigation">
            <a href="#features" className="transition hover:text-indigo-600">Features</a>
            <a href="#how-it-works" className="transition hover:text-indigo-600">How it works</a>
            <a href="#privacy" className="transition hover:text-indigo-600">Privacy</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:px-4">
              Log in
            </Link>
            <Link href="/register" aria-label="Create account" className="app-button-primary !min-h-0 !px-4 !py-2.5">
              <span className="hidden sm:inline">Create account</span>
              <span className="sm:hidden">Join</span>
            </Link>
          </div>
        </div>
      </header>

      <section id="landing-content" tabIndex={-1} className="relative outline-none">
        <div aria-hidden="true" className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-indigo-200/35 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-44 top-2 h-[30rem] w-[30rem] rounded-full bg-cyan-100/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-20 sm:px-8 sm:pt-28 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-32">
          <div data-landing-reveal className="max-w-2xl">
            <div className="app-eyebrow">Your search, organized</div>
            <h1 className="mt-6 text-5xl font-bold leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
              Organize your job search. <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">Move with confidence.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
              CareerTrack is a private workspace for saved jobs, applications, resumes, skills, interviews, and AI-assisted resume comparisons.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="app-button-primary app-arrow-action px-6 py-3.5 text-base">
                Start tracking for free <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="app-button-secondary px-6 py-3.5 text-base">
                See how it works
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              {["Personal workspace", "Private resume storage", "Clear application pipeline"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={13} strokeWidth={3} /></span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <section id="features" className="border-y border-slate-200/80 bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div data-landing-reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">Everything in one place</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">A calmer way to manage your job search</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">Replace scattered notes and spreadsheets with a workspace designed around your next opportunity.</p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description, style, accent, motion }, index) => (
              <article
                key={title}
                data-landing-reveal
                style={{
                  "--landing-reveal-delay": `${index * 70}ms`,
                  "--feature-accent": accent,
                } as CSSProperties}
                className={`landing-feature-card landing-feature-${motion}`}
              >
                <div className="relative z-10">
                  <div className={`landing-feature-icon flex h-12 w-12 items-center justify-center rounded-2xl ${style}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-[-0.02em] text-slate-900">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div data-landing-reveal className="lg:sticky lg:top-28">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">A simple workflow</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">From interesting role to informed next step</h2>
            <p className="mt-5 max-w-lg leading-7 text-slate-600">CareerTrack keeps the information you need close without turning your job search into another full-time job.</p>
          </div>
          <div className="space-y-4">
            {steps.map(([number, title, description], index) => (
              <article
                key={number}
                data-landing-reveal
                style={{ "--landing-reveal-delay": `${index * 80}ms` } as CSSProperties}
                className="landing-step-card app-surface flex gap-5 p-6 sm:gap-7 sm:p-8"
              >
                <span className="landing-step-number text-2xl font-bold tracking-[-0.05em] text-indigo-300">{number}</span>
                <div>
                  <h3 className="text-xl font-bold tracking-[-0.025em] text-slate-900">{title}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="px-5 pb-24 sm:px-8 sm:pb-28">
        <div data-landing-reveal="privacy" className="landing-privacy-card relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-14 text-white shadow-2xl shadow-slate-300/50 sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16 lg:py-16">
          <div aria-hidden="true" className="landing-privacy-orb landing-privacy-orb-one" />
          <div aria-hidden="true" className="landing-privacy-orb landing-privacy-orb-two" />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-3 text-cyan-300"><ShieldCheck size={22} /><span className="text-sm font-bold uppercase tracking-[0.16em]">Privacy by purpose</span></div>
            <h2 className="mt-5 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Your career information stays personal.</h2>
            <p className="mt-4 max-w-xl leading-7 text-slate-300">CareerTrack is a personal tracker—not a public job board. Your resumes and job-search records belong to your account and are used for AI comparison only when you request an analysis.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-slate-200">
              <span className="landing-privacy-pill"><Check size={14} /> Account-only access</span>
              <span className="landing-privacy-pill"><Check size={14} /> AI only when requested</span>
            </div>
          </div>
          <div className="landing-lock-stage relative mt-10 flex h-36 w-36 shrink-0 items-center justify-center lg:mr-5 lg:mt-0">
            <span aria-hidden="true" className="landing-lock-orbit landing-lock-orbit-outer" />
            <span aria-hidden="true" className="landing-lock-orbit landing-lock-orbit-inner" />
            <div className="landing-lock-badge relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-cyan-300 backdrop-blur-sm">
              <LockKeyhole className="landing-lock-icon" size={38} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-5 py-20 text-center sm:px-8">
        <div data-landing-reveal>
          <Sparkles className="mx-auto text-indigo-500" size={28} />
          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">Ready to make your job search easier to follow?</h2>
          <p className="mt-4 text-slate-600">Create your private workspace and keep your next move clear.</p>
          <Link href="/register" className="app-button-primary app-arrow-action mt-8 px-6 py-3.5 text-base">Create your account <ArrowRight size={18} /></Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2 font-semibold text-slate-700"><BriefcaseBusiness size={17} className="text-indigo-600" /> CareerTrack</div>
          <p>Stay organized. Move forward.</p>
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-800">Log in to your workspace</Link>
        </div>
      </footer>
    </main>
  );
}

function DashboardPreview() {
  return (
    <div data-landing-reveal="preview" style={{ "--landing-reveal-delay": "120ms" } as CSSProperties} className="landing-preview relative mx-auto w-full max-w-xl lg:mr-0">
      <div aria-hidden="true" className="absolute inset-8 rounded-[2rem] bg-indigo-500/15 blur-3xl" />
      <div className="landing-preview-frame relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/95 p-3 shadow-[0_30px_80px_rgb(15_23_42/18%)] backdrop-blur sm:p-4">
        <div className="flex items-center gap-2 border-b border-slate-100 px-2 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-2 text-[10px] font-medium text-slate-400">Your CareerTrack dashboard</span>
        </div>
        <div className="grid grid-cols-[4.25rem_1fr] gap-3 pt-3 sm:grid-cols-[7rem_1fr]">
          <div className="min-h-[23rem] rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 p-2.5 sm:p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white"><BriefcaseBusiness size={16} /></div>
            <div className="mt-7 space-y-2">
              {[0, 1, 2, 3, 4].map((item) => <div key={item} className={`h-8 rounded-lg ${item === 0 ? "bg-white" : "bg-white/[0.06]"}`} />)}
            </div>
          </div>
          <div className="min-w-0 p-1 sm:p-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Your job search</p>
            <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">Welcome back!</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[["Applications", "12"], ["Interviews", "3"], ["Saved jobs", "18"], ["Offers", "1"]].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 p-3 shadow-sm"><p className="text-[9px] text-slate-400">{label}</p><p className="mt-1 text-lg font-bold text-slate-800">{value}</p></div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3">
              <div className="flex items-center gap-2 text-violet-700"><Sparkles size={14} /><span className="text-[10px] font-bold">AI Resume Insights</span></div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-white p-2.5"><div><p className="text-[9px] text-slate-400">Strongest match</p><p className="mt-1 text-xs font-bold text-slate-800">Frontend Developer</p></div><p className="text-lg font-bold text-violet-700">88<span className="text-[9px]">/100</span></p></div>
            </div>
            <div className="mt-3 rounded-xl border border-slate-100 p-3"><div className="flex items-center gap-2"><FileText size={14} className="text-indigo-500" /><p className="text-[10px] font-bold text-slate-700">Recent applications</p></div><div className="mt-3 space-y-2">{["Example Company", "Design Studio"].map((company) => <div key={company} className="flex items-center justify-between"><span className="text-[9px] text-slate-500">{company}</span><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-semibold text-emerald-700">In progress</span></div>)}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
