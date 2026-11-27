"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Sidebar, { MobileHeader, MobileTabBar } from "@/components/Sidebar";
import { useAuth } from "@/components/AuthProvider";

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
      <div className="app-shell flex min-h-screen items-center justify-center p-6">
        <div role="status" className="app-loading-state">
          <span className="app-spinner" aria-hidden="true" />
          Checking your session…
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
        {children}
      </main>

      <MobileTabBar />
    </div>
  );
}
