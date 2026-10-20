"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";

type WorkspaceLayoutProps = {
  children: ReactNode;
};

export default function WorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-800">
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="min-h-screen lg:ml-64">
        <TopNavbar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {children}
      </main>
    </div>
  );
}