"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [router, user]);

  function switchMode() {
    setIsRegistering((current) => !current);
    setForm({ email: "", password: "", firstName: "", lastName: "" });
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

      router.replace("/");
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
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FB] p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
      `}</style>
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
