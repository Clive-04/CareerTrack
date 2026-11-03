"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthenticationLoader />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(
    () => searchParams.get("mode") === "register",
  );
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmationStarted = form.confirmPassword.length > 0;
  const passwordsMatch = confirmationStarted && form.password === form.confirmPassword;

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  function switchMode() {
    setIsRegistering((current) => !current);
    setForm({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" });
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");

    if (
      isRegistering &&
      (!form.firstName.trim() || !form.lastName.trim())
    ) {
      setError("First name and last name are required.");
      return;
    }

    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }

    if (isRegistering && form.password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }

    if (isRegistering && !form.confirmPassword) {
      setError("Please confirm your password.");
      return;
    }

    if (isRegistering && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

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
          : "Unable to complete authentication.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FB]">
        <p className="text-sm text-slate-500">Checking your session...</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#eef2ff_0%,#f8fafc_48%,#ecfeff_100%)] p-4 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.32]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(99 102 241 / 10%) 1px, transparent 1px), linear-gradient(90deg, rgb(99 102 241 / 10%) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to bottom, black, transparent 82%)",
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-300/35 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-28 h-[28rem] w-[28rem] rounded-full bg-cyan-300/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[12%] top-[18%] h-28 w-28 rotate-12 rounded-[2rem] border border-white/60 bg-white/25 shadow-xl backdrop-blur-sm" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[16%] left-[10%] h-20 w-20 -rotate-12 rounded-3xl border border-indigo-200/50 bg-indigo-100/25 shadow-lg backdrop-blur-sm" />

      <section className="relative w-full max-w-md rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_28px_80px_rgb(30_41_59/16%)] backdrop-blur-xl sm:p-8">
        <div
          key={isRegistering ? "register" : "login"}
          className={isRegistering ? "auth-mode-enter-forward" : "auth-mode-enter-back"}
        >
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
            <p className="text-sm font-semibold text-blue-600">CareerTrack</p>
            <h1 className="text-xl font-bold text-slate-900">
              {isRegistering ? "Create your account" : "Welcome back"}
            </h1>
          </div>
        </div>

        <p className="mt-6 text-sm leading-6 text-slate-500">
          {isRegistering
            ? "Create an account to start tracking your career progress."
            : "Sign in to continue managing your job search."}
        </p>

        <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegistering && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <input
                  autoComplete="given-name"
                  required
                  value={form.firstName}
                  onChange={(event) =>
                    setForm({ ...form, firstName: event.target.value })
                  }
                  className="auth-input"
                />
              </Field>
              <Field label="Last name">
                <input
                  autoComplete="family-name"
                  required
                  value={form.lastName}
                  onChange={(event) =>
                    setForm({ ...form, lastName: event.target.value })
                  }
                  className="auth-input"
                />
              </Field>
            </div>
          )}

          <Field label="Email">
            <input
              autoComplete="email"
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              className="auth-input"
            />
          </Field>

          <Field label="Password">
            <input
              autoComplete={isRegistering ? "new-password" : "current-password"}
              maxLength={72}
              required
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              className="auth-input"
            />
          </Field>

          {isRegistering && (
            <Field label="Confirm password">
              <div className="relative">
                <input
                  aria-describedby={confirmationStarted ? "password-confirmation-status" : undefined}
                  autoComplete="new-password"
                  maxLength={72}
                  required
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setForm({ ...form, confirmPassword: event.target.value })
                  }
                  className={`auth-input !pr-11 ${
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
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
                      passwordsMatch ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {passwordsMatch ? <CheckCircle2 size={19} /> : <XCircle size={19} />}
                  </span>
                )}
              </div>
              {confirmationStarted && (
                <span
                  id="password-confirmation-status"
                  role="status"
                  aria-live="polite"
                  className={`block text-xs font-medium ${
                    passwordsMatch ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                </span>
              )}
            </Field>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Please wait..."
              : isRegistering
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={switchMode}
          className="mt-5 w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          {isRegistering
            ? "Already have an account? Sign in"
            : "Need an account? Create one"}
        </button>
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
        }

        .auth-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgb(59 130 246 / 12%);
        }

        @keyframes auth-mode-forward {
          from {
            opacity: 0;
            transform: translateX(18px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes auth-mode-back {
          from {
            opacity: 0;
            transform: translateX(-18px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .auth-mode-enter-forward {
          animation: auth-mode-forward 550ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .auth-mode-enter-back {
          animation: auth-mode-back 550ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-mode-enter-forward,
          .auth-mode-enter-back {
            animation: none;
          }
        }
      `}</style>
    </main>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
