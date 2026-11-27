"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  Gauge,
  LogOut,
  Menu,
  Shapes,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import ActionMenu from "@/components/ActionMenu";
import { useAuth } from "@/components/AuthProvider";
import BrandLogo from "@/components/BrandLogo";
import useDialogControls from "@/hooks/useDialogControls";

type NavItem = { label: string; href: string; icon: LucideIcon };

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Job search",
    items: [
      { label: "Overview", href: "/dashboard", icon: Gauge },
      { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
      { label: "Applications", href: "/applications", icon: ClipboardList },
      { label: "Interviews", href: "/interviews", icon: CalendarDays },
    ],
  },
  {
    label: "Materials",
    items: [
      { label: "Resumes", href: "/resumes", icon: FileText },
      { label: "Skills", href: "/skills", icon: Shapes },
    ],
  },
];

const PRIMARY_TABS = NAV_GROUPS[0].items;
const MORE_ITEMS = NAV_GROUPS[1].items;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

function Initials({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <span
      aria-hidden="true"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[0.8125rem] font-semibold text-cyan-800 ${className}`}
    >
      {`${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()}
    </span>
  );
}

function AccountMenu({ variant }: { variant: "sidebar" | "rail" | "header" }) {
  const { user, logout } = useAuth();
  if (!user) return null;
  const fullName = `${user.first_name} ${user.last_name}`;

  const buttonClassName = {
    sidebar: "flex min-h-11 w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm text-white hover:bg-white/7",
    rail: "flex h-11 w-11 items-center justify-center rounded-md hover:bg-white/7",
    header: "flex h-11 w-11 items-center justify-center rounded-md hover:bg-slate-100",
  }[variant];

  const menuClassName = {
    sidebar: "bottom-full left-0 mb-2 w-[13rem]",
    rail: "bottom-0 left-full ml-2",
    header: "right-0 top-full mt-1",
  }[variant];

  return (
    <ActionMenu
      label={`Account: ${fullName}`}
      buttonClassName={buttonClassName}
      menuClassName={menuClassName}
      buttonContent={
        <>
          <Initials />
          {variant === "sidebar" && <span className="min-w-0 flex-1 truncate font-medium">{fullName}</span>}
        </>
      }
      header={
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{fullName}</p>
          <p className="truncate text-[0.8125rem] text-slate-500">{user.email}</p>
        </div>
      }
      items={[{ label: "Log out", icon: LogOut, onSelect: logout }]}
    />
  );
}

/** Desktop sidebar (lg+) and icon rail (md to lg). */
export default function Sidebar() {
  const isActive = useIsActive();
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside
      aria-label="Primary"
      className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col bg-[var(--ink)] text-white md:flex lg:w-[14.5rem]"
    >
      <Link
        href="/dashboard"
        className="flex h-16 items-center justify-center gap-2.5 px-4 lg:justify-start lg:px-5"
        aria-label="CareerTrack overview"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white">
          <BrandLogo className="h-8 w-8" priority />
        </span>
        <span className="hidden text-[1.0625rem] font-semibold lg:inline">CareerTrack</span>
      </Link>

      <nav aria-label="Workspace" className="flex-1 overflow-y-auto px-3 py-4 lg:px-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-1.5 hidden px-3 text-[0.8125rem] font-medium text-[#9f9bb8] lg:block">{group.label}</p>
            <div className="hidden h-px bg-white/10 md:block lg:hidden" aria-hidden="true" />
            <ul className="space-y-0.5 pt-1 lg:pt-0">
              {group.items.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive(href) ? "page" : undefined}
                    className="app-nav-link flex-col !gap-1 !px-1 text-center !text-[0.6875rem] lg:flex-row lg:!gap-3 lg:!px-3 lg:text-left lg:!text-[0.9375rem]"
                  >
                    <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3 lg:p-4">
        <div className="hidden lg:block"><AccountMenu variant="sidebar" /></div>
        <div className="flex justify-center lg:hidden"><AccountMenu variant="rail" /></div>
      </div>
    </aside>
  );
}

/** Phone header (below md): brand and account menu. */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2" aria-label="CareerTrack overview">
        <BrandLogo className="h-7 w-7" />
        <span className="text-base font-semibold text-slate-900">CareerTrack</span>
      </Link>
      <AccountMenu variant="header" />
    </header>
  );
}

/** Phone bottom tab bar (below md). Resumes and Skills live under More. */
export function MobileTabBar() {
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  useDialogControls(moreOpen, () => setMoreOpen(false));
  const moreActive = MORE_ITEMS.some((item) => isActive(item.href));

  return (
    <>
      <nav
        aria-label="Workspace"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex">
          {PRIMARY_TABS.map(({ label, href, icon: Icon }) => (
            <li key={href} className="flex flex-1">
              <Link href={href} aria-current={isActive(href) ? "page" : undefined} className="app-tabbar-link">
                <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
          <li className="flex flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-current={moreActive ? "page" : undefined}
              className="app-tabbar-link"
            >
              <Menu size={20} strokeWidth={1.9} aria-hidden="true" />
              More
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="app-modal-backdrop !items-end !p-0 md:hidden" onClick={() => setMoreOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-menu-title"
            onClick={(event) => event.stopPropagation()}
            className="app-modal-panel !rounded-b-none pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 id="more-menu-title" className="text-base font-semibold text-slate-900">More</h2>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className="app-icon-button app-icon-button-ghost">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <ul className="p-2">
              {MORE_ITEMS.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={isActive(href) ? "page" : undefined}
                    className="app-menu-item aria-[current=page]:font-semibold aria-[current=page]:text-indigo-700"
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
