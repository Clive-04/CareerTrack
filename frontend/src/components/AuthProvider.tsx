"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { LogOut, X } from "lucide-react";
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  type ApiUser,
} from "@/lib/api";

const authTokenKey = "careertrack.auth.token";

type AuthContextValue = {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(authTokenKey),
  );
  const [isLoading, setIsLoading] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.localStorage.getItem(authTokenKey)),
  );
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  useEffect(() => {
    const storedToken = token;

    if (!storedToken) {
      return;
    }

    let active = true;
    getCurrentUser(storedToken)
      .then((profile) => { if (active) setUser(profile); })
      .catch(() => {
        if (!active) return;
        window.localStorage.removeItem(authTokenKey);
        setToken(null);
        setUser(null);
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function login(email: string, password: string) {
    const result = await loginRequest(email, password);
    const profile = await getCurrentUser(result.access_token);
    window.localStorage.setItem(authTokenKey, result.access_token);
    setToken(result.access_token);
    setUser(profile);
  }

  async function register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    await registerRequest(email, password, firstName, lastName);
    await login(email, password);
  }

  function logout() {
    setShowLogoutConfirmation(true);
  }

  function confirmLogout() {
    setShowLogoutConfirmation(false);

    window.localStorage.removeItem(authTokenKey);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout }}
    >
      {children}

      {showLogoutConfirmation && user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="relative flex items-start justify-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <LogOut size={21} />
              </div>

              <button
                type="button"
                aria-label="Close logout confirmation"
                onClick={() => setShowLogoutConfirmation(false)}
                className="absolute right-0 top-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <h2
              id="logout-dialog-title"
              className="mt-5 text-center text-lg font-bold text-slate-900"
            >
              Log out of CareerTrack?
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              You will need to sign in again to access your workspace.
            </p>

            <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowLogoutConfirmation(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
