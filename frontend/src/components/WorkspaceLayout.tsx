"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar, { MobileHeader, MobileTabBar } from "@/components/Sidebar";
import { useAuth } from "@/components/AuthProvider";
import { ListSkeleton } from "@/components/Skeleton";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return (
      <div className="app-shell min-h-screen md:pl-20 lg:pl-[14.5rem]">
        <div className="app-page space-y-6" aria-busy="true">
          <span className="app-skeleton block h-9 w-56" aria-hidden="true" />
          <ListSkeleton rows={4} label="Checking your session" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen text-slate-800">
      <a href="#workspace-content" className="app-skip-link">
        Skip to main content
      </a>
      <Sidebar />
      <MobileHeader />

      <main
        id="workspace-content"
        tabIndex={-1}
        className="min-h-screen pb-20 outline-none md:pb-0 md:pl-20 lg:pl-[14.5rem]"
      >
        <RouteEntrance>{children}</RouteEntrance>
      </main>

      <MobileTabBar />
    </div>
  );
}

// Covers --dur-page plus one --stagger step (see globals.css).
const ENTRANCE_MS = 500;

/**
 * The page header and first region enter once per route per browser session.
 * Returning to a page you have already seen renders it immediately.
 */
function RouteEntrance({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const storageKey = `careertrack:entered:${pathname}`;
  const [play, setPlay] = useState(() => {
    try {
      return window.sessionStorage.getItem(storageKey) === null;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Storage can be unavailable (private mode); the entrance simply replays.
    }
    // Next.js may keep a visited route alive and show it again later; switch the
    // entrance off once it has run so a restored page doesn't animate again.
    const timer = window.setTimeout(() => setPlay(false), ENTRANCE_MS);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  return <div data-entrance={play ? "play" : "off"}>{children}</div>;
}
