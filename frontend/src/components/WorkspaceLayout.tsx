"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import { useAuth } from "@/components/AuthProvider";

type WorkspaceLayoutProps = {
  children: ReactNode;
};

export default function WorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center p-6">
        <div className="app-surface flex items-center gap-3 px-5 py-4">
          <span className="app-spinner" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600">Checking your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen text-slate-800">
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="min-h-screen lg:ml-72">
        <TopNavbar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <div key={pathname} className="app-page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
