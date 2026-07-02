"use client";

import type { ReactNode } from "react";
import { useRequireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default function ParentLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useRequireRole("parent");

  if (loading || !user) return null;

  return <AppShell>{children}</AppShell>;
}
