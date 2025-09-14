"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const hasSeenOnboard = localStorage.getItem("hasSeenOnboard");

    if (hasSeenOnboard) {
      // Already visited before → go to login
      router.replace("/auth/register");
    } else {
      // First time → mark as seen and go to onboard
      localStorage.setItem("hasSeenOnboard", "true");
      router.replace("/onboard");
    }
  }, [router]);

  return null;
}
