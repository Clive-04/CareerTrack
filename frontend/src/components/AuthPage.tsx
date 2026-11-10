"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  validateLogin,
  validateRegistration,
} from "@/lib/authValidation";

type AuthMode = "login" | "register";

const emptyForm = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
};

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { user, isLoading, login, register } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const isRegistering = mode === "register";
  const confirmationStarted = form.confirmPassword.length > 0;
  const passwordsMatch = confirmationStarted && form.password === form.confirmPassword;
  const passwordIsLongEnough = form.password.length >= 12;
  const passwordHasUppercase = /[A-Z]/u.test(form.password);
  const passwordHasLowercase = /[a-z]/u.test(form.password);
  const passwordHasSpecialCharacter = /[^A-Za-z0-9\s]/u.test(form.password);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const validationError = isRegistering
      ? validateRegistration(form)
      : validateLogin(form.email, form.password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await register(
          form.email.trim(),
          form.password,
          form.firstName.trim(),
          form.lastName.trim(),
        );
      } else {
        await login(form.email.trim(), form.password);
      }
      router.replace("/dashboard");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to complete authentication. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || user) return <AuthenticationLoader />;

  return (
    <main className="relative flex min-h-screen items-start justify-center overflow-x-hidden bg-[linear-gradient(135deg,#eef2ff_0%,#f8fafc_48%,#ecfeff_100%)] p-4 sm:items-center sm:p-8">
      <AuthBackground />

      <section className="relative w-full max-w-md rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_28px_80px_rgb(30_41_59/16%)] backdrop-blur-xl sm:p-8">
        <div className={isRegistering ? "auth-mode-enter-forward" : "auth-mode-enter-back"}>
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#172B4D] text-white">
              <BriefcaseBusiness size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-600">CareerTrack</p>
              <h1 className="text-xl font-bold text-slate-900">
                {isRegistering ? "Create your account" : "Welcome back"}
              </h1>
            </div>
          </div>

          <p className="mt-6 text-sm leading-6 text-slate-500">
            {isRegistering
              ? "Create your private workspace to start organizing your career progress."
              : "Sign in to continue managing your job search."}
          </p>

          <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isRegistering && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" htmlFor="first-name">
                  <input
                    id="first-name"
                    autoComplete="given-name"
                    maxLength={100}
                    required
                    value={form.firstName}
                    onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                    className="auth-input"
                  />
                </Field>
                <Field label="Last name" htmlFor="last-name">
                  <input
                    id="last-name"
                    autoComplete="family-name"
                    maxLength={100}
                    required
                    value={form.lastName}
                    onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                    className="auth-input"
                  />
                </Field>
              </div>
            )}

            <Field label="Email" htmlFor="email">
              <input
                id="email"
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="auth-input"
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <PasswordInput
                id="password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                shown={showPassword}
                value={form.password}
                onChange={(password) => setForm({ ...form, password })}
                onToggle={() => setShowPassword((current) => !current)}
              />
            </Field>

            {isRegistering && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3" aria-label="Password requirements">
                <p className="text-xs font-semibold text-slate-600">Password requirements</p>
                <div className="mt-2 space-y-1.5">
                  <Requirement met={passwordIsLongEnough} label="At least 12 characters" />
                  <Requirement met={passwordHasUppercase} label="One uppercase letter" />
                  <Requirement met={passwordHasLowercase} label="One lowercase letter" />
                  <Requirement met={passwordHasSpecialCharacter} label="One special character" />
                </div>
              </div>
            )}

            {isRegistering && (
              <Field label="Confirm password" htmlFor="confirm-password">
                <div className="relative">
                  <input
                    id="confirm-password"
                    aria-describedby={confirmationStarted ? "password-confirmation-status" : undefined}
                    autoComplete="new-password"
                    maxLength={72}
                    required
                    type={showConfirmation ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                    className={`auth-input !pr-[4.75rem] ${
                      confirmationStarted
                        ? passwordsMatch
                          ? "!border-emerald-400"
                          : "!border-red-400"
                        : ""
                    }`}
                  />
                  {confirmationStarted && (
                    <span
                      aria-label={passwordsMatch ? "Passwords match" : "Passwords do not match"}
                      className={`pointer-events-none absolute right-11 top-1/2 -translate-y-1/2 ${passwordsMatch ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {passwordsMatch ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </span>
                  )}
                  <VisibilityButton
                    shown={showConfirmation}
                    label="confirmation password"
                    onClick={() => setShowConfirmation((current) => !current)}
                  />
                </div>
                {confirmationStarted && (
                  <span
                    id="password-confirmation-status"
                    role="status"
                    aria-live="polite"
                    className={`block text-xs font-medium ${passwordsMatch ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                  </span>
                )}
              </Field>
            )}

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="app-button-primary w-full"
            >
              {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />}
              {isSubmitting ? "Please wait..." : isRegistering ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {isRegistering ? "Already have an account?" : "Need an account?"}{" "}
            <Link
              href={isRegistering ? "/login" : "/register"}
              className="font-semibold text-indigo-600 transition hover:text-indigo-800"
            >
              {isRegistering ? "Sign in" : "Create one"}
            </Link>
          </p>
        </div>
      </section>

      <style jsx global>{`
        .auth-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.7rem 0.85rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
        }
        .auth-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgb(99 102 241 / 12%);
        }
        @keyframes auth-mode-forward {
          from { opacity: 0; transform: translateX(18px) scale(0.99); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes auth-mode-back {
          from { opacity: 0; transform: translateX(-18px) scale(0.99); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .auth-mode-enter-forward { animation: auth-mode-forward 550ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .auth-mode-enter-back { animation: auth-mode-back 550ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .auth-mode-enter-forward, .auth-mode-enter-back { animation: none; }
        }
      `}</style>
    </main>
  );
}

function AuthBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.32]"
        style={{
          backgroundImage: "linear-gradient(rgb(99 102 241 / 10%) 1px, transparent 1px), linear-gradient(90deg, rgb(99 102 241 / 10%) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to bottom, black, transparent 82%)",
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-300/35 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-28 h-[28rem] w-[28rem] rounded-full bg-cyan-300/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[12%] top-[18%] h-28 w-28 rotate-12 rounded-[2rem] border border-white/60 bg-white/25 shadow-xl backdrop-blur-sm" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[16%] left-[10%] h-20 w-20 -rotate-12 rounded-3xl border border-indigo-200/50 bg-indigo-100/25 shadow-lg backdrop-blur-sm" />
    </>
  );
}

function PasswordInput({
  id,
  autoComplete,
  shown,
  value,
  onChange,
  onToggle,
}: {
  id: string;
  autoComplete: string;
  shown: boolean;
  value: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        autoComplete={autoComplete}
        maxLength={72}
        required
        type={shown ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="auth-input !pr-11"
      />
      <VisibilityButton shown={shown} label="password" onClick={onToggle} />
    </div>
  );
}

function VisibilityButton({ shown, label, onClick }: { shown: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={`${shown ? "Hide" : "Show"} ${label}`}
      onClick={onClick}
      className="app-icon-button app-icon-button-ghost app-icon-button-compact absolute right-1.5 top-1/2 -translate-y-1/2 hover:!text-indigo-600"
    >
      {shown ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${met ? "text-emerald-700" : "text-slate-500"}`}>
      {met ? <Check size={14} strokeWidth={3} /> : <Circle size={12} />}
      <span>{label}</span>
    </div>
  );
}

function AuthenticationLoader() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center p-6">
      <div className="app-surface flex items-center gap-3 px-5 py-4">
        <span className="app-spinner" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-600">Checking your session...</p>
      </div>
    </main>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2 text-sm font-medium text-slate-700">
      <label htmlFor={htmlFor} className="block">{label}</label>
      {children}
    </div>
  );
}
