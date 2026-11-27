import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import ApplicationsProvider from "@/components/ApplicationsProvider";
import JobsProvider from "@/components/JobsProvider";
import InterviewsProvider from "@/components/InterviewsProvider";
import ResumesProvider from "@/components/ResumesProvider";
import SkillsProvider from "@/components/SkillsProvider";
import AuthProvider from "@/components/AuthProvider";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  // System fallback keeps the app usable and stable before the font loads.
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Arial"],
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
      className={`${plexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
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
        </ToastProvider>
      </body>
    </html>
  );
}
