"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Clean up old onboarding localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("hasSeenOnboard");
    }
    
    // Always redirect to login page
    router.replace("/auth/login");
  }, [router]);

  return null;
}
