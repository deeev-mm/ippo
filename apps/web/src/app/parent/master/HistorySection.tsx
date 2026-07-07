import Link from "next/link";
import { ClipboardList, Star, Award } from "lucide-react";
import styles from "./master.module.css";

const LINKS = [
  { href: "/parent/history/tasks", Icon: ClipboardList, label: "タスク履歴" },
  { href: "/parent/history/rewards", Icon: Star, label: "ポイント履歴" },
  { href: "/parent/history/badges", Icon: Award, label: "バッジ履歴" },
];

export function HistorySection() {
  return (
    <>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={`card ${styles.row}`}>
          <div className={styles.rowInfo}>
            <l.Icon size={20} aria-hidden="true" />
            <strong>{l.label}</strong>
          </div>
        </Link>
      ))}
    </>
  );
}
