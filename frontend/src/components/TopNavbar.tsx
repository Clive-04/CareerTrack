"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Menu } from "lucide-react";

type TopNavbarProps = {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
};

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/jobs": "Jobs",
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
  const activePage = pageNames[pathname] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#172B4D] text-white transition hover:bg-[#243B60] lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm text-slate-500">
            Workspace / {activePage}
          </p>

          <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
            {activePage}
          </h2>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
        >
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white" />
        </button>

        <div className="hidden items-center gap-2 border-l border-slate-200 pl-4 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            CB
          </div>

          <span className="text-sm font-medium text-slate-800">
            My Account
          </span>

          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}