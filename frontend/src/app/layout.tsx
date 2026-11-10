import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ApplicationsProvider from "@/components/ApplicationsProvider";
import JobsProvider from "@/components/JobsProvider";
import InterviewsProvider from "@/components/InterviewsProvider";
import ResumesProvider from "@/components/ResumesProvider";
import SkillsProvider from "@/components/SkillsProvider";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CareerTrack",
    template: "%s | CareerTrack",
  },
  description: "A private workspace for organizing your job search, applications, resumes, and AI-assisted career insights.",
  icons: {
    icon: [{ url: "/careertrack-logo.png", type: "image/png", sizes: "256x256" }],
    shortcut: "/careertrack-logo.png",
    apple: [{ url: "/careertrack-logo.png", sizes: "256x256", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <JobsProvider>
            <ResumesProvider>
              <ApplicationsProvider>
                <InterviewsProvider>
                  <SkillsProvider>{children}</SkillsProvider>
                </InterviewsProvider>
              </ApplicationsProvider>
            </ResumesProvider>
          </JobsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
