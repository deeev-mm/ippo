"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role === "parent") {
      router.replace("/parent/dashboard");
    } else {
      router.replace("/child/dashboard");
    }
  }, [user, loading, router]);

  return null;
}
