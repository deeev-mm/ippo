"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import styles from "./AppShell.module.css";

type NavItem = { href: string; label: string; icon: string };

const PARENT_NAV: NavItem[] = [
  { href: "/parent/dashboard", label: "ホーム", icon: "🏠" },
  { href: "/parent/tasks", label: "タスク", icon: "📋" },
  { href: "/parent/calendar", label: "カレンダー", icon: "📅" },
  { href: "/parent/rewards", label: "ごほうび", icon: "🎁" },
  { href: "/parent/master", label: "せってい", icon: "⚙️" },
];

const CHILD_NAV: NavItem[] = [
  { href: "/child/dashboard", label: "ホーム", icon: "🏠" },
  { href: "/child/tasks", label: "タスク", icon: "📋" },
  { href: "/child/calendar", label: "カレンダー", icon: "📅" },
  { href: "/child/rewards", label: "ごほうび", icon: "🎁" },
  { href: "/child/badges", label: "バッジ", icon: "🏅" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const nav = user?.role === "parent" ? PARENT_NAV : CHILD_NAV;

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <>
      <header className={styles.topbar}>
        <span className={`brand ${styles.topbarBrand}`}>
          👣 ippo
        </span>
        {user && (
          <div className={styles.topbarUser}>
            <span className={styles.topbarName}>
              {user.avatar} {user.name}
            </span>
            <button className="btn btnGhost" onClick={onLogout}>
              ログアウト
            </button>
          </div>
        )}
      </header>

      <main className="container">{children}</main>

      {user && (
        <nav className={styles.nav}>
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
