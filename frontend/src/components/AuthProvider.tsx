"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { LogOut, X } from "lucide-react";
import useDialogControls from "@/hooks/useDialogControls";
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

  useDialogControls(showLogoutConfirmation, () => setShowLogoutConfirmation(false));

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
    window.location.replace("/");
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout }}
    >
      {children}

      {showLogoutConfirmation && user && (
        <div className="app-modal-backdrop !z-[100]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            className="app-modal-panel max-w-sm p-6"
          >
            <div className="relative flex items-start justify-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <LogOut size={21} />
              </div>

              <button
                type="button"
                aria-label="Close logout confirmation"
                onClick={() => setShowLogoutConfirmation(false)}
                className="app-icon-button app-icon-button-ghost app-icon-button-compact absolute right-0 top-0"
              >
                <X size={19} />
              </button>
            </div>

            <h2
              id="logout-dialog-title"
              className="mx-auto mt-5 w-fit rounded-lg bg-red-50 px-3 py-2 text-center text-lg font-bold text-red-800"
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
                className="app-button-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="app-button-danger"
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
