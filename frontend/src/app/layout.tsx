import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import ApplicationsProvider from "@/components/ApplicationsProvider";
import JobsProvider from "@/components/JobsProvider";
import InterviewsProvider from "@/components/InterviewsProvider";
import ResumesProvider from "@/components/ResumesProvider";
import SkillsProvider from "@/components/SkillsProvider";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Serif is reserved for page titles, echoing a printed résumé.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
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
      className={`${plexSans.variable} ${sourceSerif.variable} h-full antialiased`}
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
