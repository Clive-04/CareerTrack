import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your private CareerTrack workspace.",
};

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}

