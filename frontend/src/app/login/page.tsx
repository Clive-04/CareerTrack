import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your private CareerTrack workspace.",
};

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
