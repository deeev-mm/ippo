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
import { api, type ProgressReport } from "@/lib/api";
import styles from "./page.module.css";

function formatDay(ymd: string) {
  const [, m, d] = ymd.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default function ParentReportPage() {
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [selected, setSelected] = useState<string>("all");

  useEffect(() => {
    api.reports.progress({ days: "7" }).then(setReport);
  }, []);

  if (!report) return <p className="hint">読み込み中...</p>;

  const targets = selected === "all" ? report.children : report.children.filter((c) => c.id === selected);

  const totals = report.children.map((c) => ({
    ...c,
    completed: (report.completed[c.id] ?? []).reduce((a, b) => a + b, 0),
    points: (report.points[c.id] ?? []).reduce((a, b) => a + b, 0),
  }));

  return (
    <>
      <h1 className="pageTitle">レポート</h1>
      <p className="pageSubtitle">この7日間のがんばり</p>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${selected === "all" ? styles.tabActive : ""}`}
          onClick={() => setSelected("all")}
        >
          すべて
        </button>
        {report.children.map((c) => (
          <button
            key={c.id}
            className={`${styles.tab} ${selected === c.id ? styles.tabActive : ""}`}
            onClick={() => setSelected(c.id)}
          >
            {c.avatar} {c.name}
          </button>
        ))}
      </div>

      <div className={styles.summaryRow}>
        {totals
          .filter((t) => selected === "all" || t.id === selected)
          .map((t) => (
            <div key={t.id} className={`card ${styles.summaryCard}`}>
              <div className={styles.summaryValue}>{t.completed}</div>
              <div className={styles.summaryLabel}>
                {t.name} ・かんりょう（⭐{t.points}pt）
              </div>
            </div>
          ))}
        {report.children.length === 0 && <p className="emptyState">子どもアカウントがありません</p>}
      </div>

      {targets.map((child) => {
        const completed = report.completed[child.id] ?? [];
        const points = report.points[child.id] ?? [];
        const chartData = report.days.map((day, i) => ({
          day: formatDay(day),
          かんりょう: completed[i] ?? 0,
          ポイント: points[i] ?? 0,
        }));
        return (
          <div key={child.id} className={`card ${styles.chartCard}`}>
            <div className={styles.chartTitle}>
              {child.avatar} {child.name}
            </div>
            <ResponsiveContainer width="100%" height={200}>
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
        );
      })}
    </>
  );
}
