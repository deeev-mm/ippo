"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Plus, Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import styles from "./page.module.css";

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<{ user_id: string; name: string; balance: number }[]>([]);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [balanceRes, taskRes, rewardRes] = await Promise.all([
        api.rewardBalance.all(),
        api.tasks.list({ status: "submitted" }),
        api.rewardRequests.list({ status: "submitted" }),
      ]);
      setBalances(balanceRes.balances);
      setPendingTasks(taskRes.total);
      setPendingRewards(rewardRes.requests.length);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <h1 className="pageTitle">こんにちは、{user?.name}さん</h1>
      <p className="pageSubtitle">今日もいっぽずつ、がんばろう。</p>

      {loading ? (
        <p className="hint">読み込み中...</p>
      ) : (
        <>
          <div className={styles.grid}>
            <Link href="/parent/tasks?status=submitted" className={`card ${styles.statCard}`}>
              <span className={styles.statValue}>{pendingTasks}</span>
              <span className={styles.statLabel}>かくにん待ちのタスク</span>
            </Link>
            <Link href="/parent/rewards" className={`card ${styles.statCard}`}>
              <span className={styles.statValue}>{pendingRewards}</span>
              <span className={styles.statLabel}>ごほうび申請</span>
            </Link>
          </div>

          <Link href="/parent/report" className="btn btnSecondary btnBlock">
            <BarChart3 size={16} aria-hidden="true" /> レポートを見る
          </Link>
          <div className="spacer" />

          <h2 className="pageTitle" style={{ fontSize: "1.1rem" }}>
            こどものポイント
          </h2>
          {balances.length === 0 ? (
            <p className="emptyState">まだ子どもアカウントがありません</p>
          ) : (
            balances.map((b) => (
              <div key={b.user_id} className={`card ${styles.childRow}`}>
                <div className={styles.childInfo}>
                  <div className={styles.childName}>{b.name}</div>
                </div>
                <span className="pointsChip">
                  <Star size={14} aria-hidden="true" /> {b.balance}pt
                </span>
              </div>
            ))
          )}

          <div className="spacer" />
          <Link href="/parent/tasks/new" className="btn btnBlock">
            <Plus size={16} aria-hidden="true" /> タスクをつくる
          </Link>
        </>
      )}
    </>
  );
}
