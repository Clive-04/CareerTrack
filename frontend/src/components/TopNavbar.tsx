"use client";

import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import BrandLogo from "@/components/BrandLogo";

type TopNavbarProps = {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
};

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/jobs": "Saved Jobs",
  "/applications": "Applications",
  "/interviews": "Interviews",
  "/resumes": "Resumes",
  "/skills": "Skills",
};

export default function TopNavbar({
  mobileMenuOpen,
  setMobileMenuOpen,
}: TopNavbarProps) {
  const pathname = usePathname();
  const activePage = pageNames[pathname] ?? "Workspace";
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();

  return (
    <header className="app-topbar-enter sticky top-0 z-30 flex h-[4.5rem] items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 shadow-[0_1px_0_rgb(255_255_255/80%)] backdrop-blur-xl sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition hover:bg-indigo-600 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <BrandLogo className="h-7 w-7 sm:h-8 sm:w-8 lg:hidden" />

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>CareerTrack</span>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <span className="truncate text-indigo-600">{activePage}</span>
          </div>
          <h2 className="mt-0.5 truncate text-lg font-bold tracking-[-0.025em] text-slate-900">{activePage}</h2>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/80 py-1.5 pl-2 pr-2 shadow-sm sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-cyan-100 text-xs font-bold text-indigo-700">
            {initials}
          </div>
          <div className="max-w-36 pr-1">
            <p className="truncate text-sm font-semibold text-slate-800">{user.first_name} {user.last_name}</p>
            <p className="truncate text-[11px] text-slate-400">Personal workspace</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} />
          </button>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-cyan-100 text-xs font-bold text-indigo-700 sm:hidden">
          {initials}
        </div>
      </div>
    </header>
  );
}
