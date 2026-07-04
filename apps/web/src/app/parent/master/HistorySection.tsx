import Link from "next/link";
import styles from "./master.module.css";

const LINKS = [
  { href: "/parent/history/tasks", icon: "📋", label: "タスク履歴" },
  { href: "/parent/history/rewards", icon: "⭐", label: "ポイント履歴" },
  { href: "/parent/history/badges", icon: "🏅", label: "バッジ履歴" },
];

export function HistorySection() {
  return (
    <>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={`card ${styles.row}`}>
          <div className={styles.rowInfo}>
            <span>{l.icon}</span>
            <strong>{l.label}</strong>
          </div>
        </Link>
      ))}
    </>
  );
}
