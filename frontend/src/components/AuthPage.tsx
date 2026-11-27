"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import BrandLogo from "@/components/BrandLogo";
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
    <main className="grid min-h-screen bg-[var(--paper)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <AuthBrandPanel />

      <section className="flex items-start justify-center px-4 py-8 sm:items-center sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex min-h-10 items-center gap-2 rounded text-sm font-medium text-slate-600 hover:text-indigo-700"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            CareerTrack home
          </Link>

          <div className="flex items-center gap-3 lg:hidden">
            <BrandLogo className="h-9 w-9" priority />
            <span className="text-lg font-semibold text-slate-900">CareerTrack</span>
          </div>

          <h1 className="font-display mt-6 text-[2rem] leading-tight text-slate-900 lg:mt-0">
            {isRegistering ? "Create your account" : "Sign in"}
          </h1>
          <p className="mt-2 text-[0.9375rem] leading-6 text-slate-600">
            {isRegistering
              ? "Your jobs, applications, and resumes stay private to your account."
              : "Pick up your job search where you left off."}
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
              <div className="rounded-[var(--radius-control)] border border-slate-200 bg-white p-3">
                <p className="text-[0.8125rem] font-semibold text-slate-700">Your password needs</p>
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
              <div role="alert" className="app-notice-error">
                <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="app-button-primary w-full"
            >
              {isSubmitting && <span className="app-spinner !border-white/30 !border-t-white" aria-hidden="true" />}
              {isSubmitting
                ? isRegistering ? "Creating account…" : "Signing in…"
                : isRegistering ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            {isRegistering ? "Already have an account?" : "New to CareerTrack?"}{" "}
            <Link
              href={isRegistering ? "/login" : "/register"}
              className="app-button-text"
            >
              {isRegistering ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

/** Large screens only: the brand and the career track, in the app's ink. */
function AuthBrandPanel() {
  return (
    <aside aria-hidden="true" className="hidden flex-col justify-between bg-[var(--ink)] p-12 text-white lg:flex">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white">
          <BrandLogo className="h-9 w-9" priority />
        </span>
        <span className="text-lg font-semibold">CareerTrack</span>
      </div>
      <div className="max-w-sm">
        <p className="font-display text-[1.75rem] leading-snug">Every application, from saved to signed.</p>
        <div className="mt-8 flex items-center">
          {["Saved", "Applied", "Interview", "Offer"].map((stage, index) => (
            <div key={stage} className="flex flex-1 items-center last:flex-none">
              <span className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${index < 3 ? "border-[#2fa8bc] bg-[#2fa8bc]" : "border-[#6fc6d4] bg-transparent"}`} />
              {index < 3 && <span className={`h-0.5 flex-1 ${index < 2 ? "bg-[#2fa8bc]" : "bg-white/25"}`} />}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[0.8125rem] text-[#c9c6dc]">
          <span>Saved</span><span>Applied</span><span>Interview</span><span>Offer</span>
        </div>
      </div>
      <p className="text-sm text-[#9f9bb8]">Your data stays private to your account.</p>
    </aside>
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
    <div className={`flex items-center gap-2 text-[0.8125rem] ${met ? "text-emerald-700" : "text-slate-600"}`}>
      {met ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <Circle size={12} aria-hidden="true" />}
      <span>{label}<span className="sr-only">{met ? " (done)" : " (not yet)"}</span></span>
    </div>
  );
}

function AuthenticationLoader() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center p-6">
      <div role="status" className="app-loading-state">
        <span className="app-spinner" aria-hidden="true" />
        Checking your session…
      </div>
    </main>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="app-field-label !mb-0">{label}</label>
      {children}
    </div>
  );
}
