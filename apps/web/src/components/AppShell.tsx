"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Footprints, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Icon } from "./Icon";
import type { IconName } from "@/lib/icons";
import styles from "./AppShell.module.css";

type NavItem = { href: string; label: string; icon: IconName };

const PARENT_NAV: NavItem[] = [
  { href: "/parent/dashboard", label: "ホーム", icon: "Home" },
  { href: "/parent/tasks", label: "タスク", icon: "ClipboardList" },
  { href: "/parent/calendar", label: "カレンダー", icon: "CalendarDays" },
  { href: "/parent/rewards", label: "ごほうび", icon: "Gift" },
  { href: "/parent/master", label: "せってい", icon: "Settings" },
];

const CHILD_NAV: NavItem[] = [
  { href: "/child/dashboard", label: "ホーム", icon: "Home" },
  { href: "/child/tasks", label: "タスク", icon: "ClipboardList" },
  { href: "/child/calendar", label: "カレンダー", icon: "CalendarDays" },
  { href: "/child/rewards", label: "ごほうび", icon: "Gift" },
  { href: "/child/badges", label: "バッジ", icon: "Award" },
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
          <Footprints size={20} aria-hidden="true" /> ippo
        </span>
        {user && (
          <div className={styles.topbarUser}>
            <span className={styles.topbarName}>
              <Icon name={user.avatar} size={16} /> {user.name}
            </span>
            <button className="btn btnGhost" onClick={onLogout}>
              <LogOut size={16} aria-hidden="true" /> ログアウト
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
                <Icon name={item.icon} size={22} className={styles.navIcon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
