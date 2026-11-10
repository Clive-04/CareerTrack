"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ClipboardList,
  CalendarDays,
  FileText,
  Brain,
  X,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Saved Jobs", href: "/jobs", icon: BriefcaseBusiness },
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
  const { user, logout } = useAuth();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      document.querySelector<HTMLButtonElement>('[aria-label="Open navigation menu"]')?.focus();
    };
  }, [mobileMenuOpen, setMobileMenuOpen]);

  if (!user) return null;

  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  const isActive = (href: string) => pathname.startsWith(href);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        aria-label="Primary navigation"
        className={`app-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden bg-[linear-gradient(165deg,#111827_0%,#111c36_52%,#0b1120_100%)] text-white shadow-2xl shadow-slate-950/15 ${mobileMenuOpen ? "app-sidebar-open" : ""}`}
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-indigo-500/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex h-20 items-center justify-between gap-3 border-b border-white/8 px-5">
          <Link href="/dashboard" onClick={closeMobileMenu} className="group flex min-w-0 items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg shadow-indigo-950/35 transition group-hover:scale-[1.03]">
              <BriefcaseBusiness size={21} />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#111827] bg-cyan-300" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold tracking-[-0.025em]">CareerTrack</span>
              <span className="block truncate text-[11px] font-medium tracking-wide text-slate-400">PRIVATE CAREER WORKSPACE</span>
            </span>
          </Link>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-4 py-6" aria-label="Workspace navigation">
          <div className="mb-4 flex items-center justify-between px-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
            <Sparkles size={14} className="text-indigo-300" />
          </div>

          <div className="space-y-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  aria-current={active ? "page" : undefined}
                  className={`app-sidebar-button group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                    active
                      ? "bg-white text-slate-950 shadow-lg shadow-black/10"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                    active ? "bg-indigo-50 text-indigo-600" : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                  }`}>
                    <Icon size={18} strokeWidth={2.1} />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="relative border-t border-white/8 p-4">
          <div className="rounded-2xl border border-white/8 bg-white/[0.06] p-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-cyan-500 text-sm font-bold shadow-md shadow-black/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user.first_name} {user.last_name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-400">{user.email}</p>
              </div>
              <button
                type="button"
                aria-label="Log out"
                title="Log out"
                onClick={logout}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-500/15 hover:text-red-300"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
