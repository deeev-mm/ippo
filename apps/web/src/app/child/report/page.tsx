"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/lib/auth";
import { api, type ProgressReport } from "@/lib/api";
import styles from "./page.module.css";

function formatDay(ymd: string) {
  const [, m, d] = ymd.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default function ChildReportPage() {
  const { user } = useAuth();
  const [report, setReport] = useState<ProgressReport | null>(null);

  useEffect(() => {
    api.reports.progress({ days: "7" }).then(setReport);
  }, []);

  if (!report || !user) return <p className="hint">読み込み中...</p>;

  const completed = report.completed[user.id] ?? [];
  const points = report.points[user.id] ?? [];
  const chartData = report.days.map((day, i) => ({
    day: formatDay(day),
    かんりょう: completed[i] ?? 0,
    ポイント: points[i] ?? 0,
  }));
  const totalCompleted = completed.reduce((a, b) => a + b, 0);
  const totalPoints = points.reduce((a, b) => a + b, 0);

  return (
    <>
      <h1 className="pageTitle">レポート</h1>
      <p className="pageSubtitle">この7日間のがんばり</p>

      <div className={styles.summaryRow}>
        <div className={`card ${styles.summaryCard}`}>
          <div className={styles.summaryValue}>{totalCompleted}</div>
          <div className={styles.summaryLabel}>かんりょうしたタスク</div>
        </div>
        <div className={`card ${styles.summaryCard}`}>
          <div className={styles.summaryValue}>{totalPoints}</div>
          <div className={styles.summaryLabel}>獲得ポイント</div>
        </div>
      </div>

      <div className={`card ${styles.chartCard}`}>
        <div className={styles.chartTitle}>日ごとの実績</div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="day" fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="かんりょう" fill="#ff6b4a" radius={[6, 6, 0, 0]} />
            <Line type="monotone" dataKey="ポイント" stroke="#ffb020" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
