"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api, type TaskWithMeta } from "@/lib/api";
import { StatusPill } from "@/components/StatusPill";
import styles from "./page.module.css";

export default function ChildDashboardPage() {
  const { user } = useAuth();
  const [todayTasks, setTodayTasks] = useState<TaskWithMeta[]>([]);
  const [stats, setStats] = useState({ task_completed: 0, points_earned: 0 });
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [today, weekday, bal] = await Promise.all([
      api.tasks.today(),
      api.tasks.weekday(),
      api.rewardBalance.mine(),
    ]);
    setTodayTasks(today);
    setStats(weekday);
    setBalance(bal.balance);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(taskId: string) {
    await api.tasks.submit(taskId);
    void load();
  }

  return (
    <>
      <div className={styles.hero}>
        <span className="avatar avatarLg">{user?.avatar}</span>
        <div>
          <h1 className="pageTitle" style={{ margin: 0 }}>
            {user?.name}さん
          </h1>
          <span className="pointsChip">⭐ {balance}pt</span>
        </div>
      </div>

      {loading ? (
        <p className="hint">読み込み中...</p>
      ) : (
        <>
          <div className={styles.grid}>
            <div className={`card ${styles.statCard}`}>
              <div className={styles.statValue}>{stats.task_completed}</div>
              <div className={styles.statLabel}>今週かんりょう</div>
            </div>
            <div className={`card ${styles.statCard}`}>
              <div className={styles.statValue}>{stats.points_earned}</div>
              <div className={styles.statLabel}>今週のポイント</div>
            </div>
          </div>

          <Link href="/child/report" className="btn btnSecondary btnBlock">
            📊 レポートを見る
          </Link>
          <div className="spacer" />

          <h2 className="pageTitle" style={{ fontSize: "1.1rem" }}>
            今日のタスク
          </h2>
          {todayTasks.length === 0 ? (
            <p className="emptyState">今日のタスクはありません</p>
          ) : (
            todayTasks.map((t) => (
              <div key={t.id} className={`card ${styles.taskRow}`}>
                <Link href={`/child/tasks/${t.id}`}>{t.title}</Link>
                {t.completionStatus === "submitted" || t.completionStatus === "approved" ? (
                  <StatusPill status={t.completionStatus} />
                ) : (
                  <button className="btn btnSm" onClick={() => submit(t.id)}>
                    できた！
                  </button>
                )}
              </div>
            ))
          )}
        </>
      )}
    </>
  );
}
