"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ClipboardList,
  CalendarDays,
  FileText,
  Brain,
  Settings,
  X,
  LogOut,
  UserRound,
} from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
  { label: "Applications", href: "/applications", icon: ClipboardList },
  { label: "Interviews", href: "/interviews", icon: CalendarDays },
  { label: "Resumes", href: "/resumes", icon: FileText },
  { label: "Skills", href: "/skills", icon: Brain },
];

type SidebarProps = {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
};

export default function Sidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#172B4D] text-white transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand and mobile close button */}
        <div className="flex h-20 items-center justify-between gap-2 border-b border-white/10 px-4">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]">
              <BriefcaseBusiness size={22} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight">
                CareerTrack
              </p>
              <p className="truncate text-xs text-slate-300">
                Job Search Workspace
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#3B82F6] text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Settings and account section */}
        <div className="space-y-2 border-t border-white/10 p-3">
          <Link
            href="/settings"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Settings size={19} />
            <span>Settings</span>
          </Link>

          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]">
              <UserRound size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Your Profile</p>
              <p className="truncate text-xs text-slate-400">Job Seeker</p>
            </div>

            <button
              type="button"
              aria-label="Log out"
              title="Log out (not connected yet)"
              disabled
              className="rounded-md p-2 text-slate-400 opacity-60"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}