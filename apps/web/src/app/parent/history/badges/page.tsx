"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { api, type BadgeAssignmentWithBadge } from "@/lib/api";
import { Icon } from "@/components/Icon";
import styles from "../history.module.css";

export default function BadgeHistoryPage() {
  const [assignments, setAssignments] = useState<BadgeAssignmentWithBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.badgeAssignments.history().then((res) => {
      setAssignments(res);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <p className={styles.crumbs}>
        <Link href="/parent/master">
          <ChevronLeft size={14} aria-hidden="true" /> せっていにもどる
        </Link>
      </p>
      <h1 className="pageTitle">バッジ履歴</h1>

      {loading ? (
        <p className="hint">読み込み中...</p>
      ) : assignments.length === 0 ? (
        <p className="emptyState">まだ誰もバッジを受け取っていません</p>
      ) : (
        assignments.map((a) => (
          <div key={a.id} className={`card ${styles.row}`}>
            <div className={styles.rowInfo}>
              <span className="avatar">
                <Icon name={a.badge.icon} size={20} />
              </span>
              <div>
                <div>
                  <strong>{a.badge.name}</strong> ・ {a.userName}
                </div>
                <div className={styles.rowMeta}>
                  {a.receivedAt && new Date(a.receivedAt).toLocaleString("ja-JP")}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}
