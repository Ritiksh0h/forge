"use client";
import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
export default function OnboardingPage() {
  const router = useRouter();
  return <OnboardingFlow onComplete={() => router.push("/dashboard")} />;
}
