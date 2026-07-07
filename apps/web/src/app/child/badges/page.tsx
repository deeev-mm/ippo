"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type BadgeAssignmentWithBadge } from "@/lib/api";
import { Icon } from "@/components/Icon";
import styles from "./page.module.css";

export default function ChildBadgesPage() {
  const [assignments, setAssignments] = useState<BadgeAssignmentWithBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setAssignments(await api.badgeAssignments.list());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function receive(id: string) {
    await api.badgeAssignments.receive(id);
    void load();
  }

  if (loading) return <p className="hint">読み込み中...</p>;

  return (
    <>
      <h1 className="pageTitle">バッジ</h1>
      {assignments.length === 0 ? (
        <p className="emptyState">まだバッジはありません。タスクをがんばろう！</p>
      ) : (
        assignments.map((a) => (
          <div key={a.id} className={`card ${styles.row} ${a.status === "pending" ? styles.locked : ""}`}>
            <div className={styles.info}>
              <span className="avatar avatarLg">
                <Icon name={a.badge.icon} size={30} />
              </span>
              <div>
                <div>
                  <strong>{a.badge.name}</strong>
                </div>
                <div className="hint">
                  {a.status === "granted"
                    ? `${new Date(a.receivedAt ?? a.assignedAt).toLocaleDateString("ja-JP")} に受け取り`
                    : "受け取り待ち"}
                </div>
              </div>
            </div>
            {a.status === "pending" && (
              <button className="btn btnSm" onClick={() => receive(a.id)}>
                受け取る
              </button>
            )}
          </div>
        ))
      )}
    </>
  );
}
