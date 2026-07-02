"use client";

import type { ReactNode } from "react";
import { useRequireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default function ChildLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useRequireRole("child");

  if (loading || !user) return null;

  return <AppShell>{children}</AppShell>;
}
