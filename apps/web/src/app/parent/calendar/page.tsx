"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, type TaskWithMeta } from "@/lib/api";
import styles from "./page.module.css";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ParentCalendarPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);

  useEffect(() => {
    api.tasks.calendar().then(setTasks);
  }, []);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const list: (Date | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(year, month, d));
    return list;
  }, [cursor]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskWithMeta[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    return map;
  }, [tasks]);

  const today = toYmd(new Date());

  return (
    <>
      <div className={styles.header}>
        <button
          className="btn btnSecondary btnSm"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          <ChevronLeft size={16} aria-hidden="true" /> 前月
        </button>
        <h1 className="pageTitle" style={{ margin: 0 }}>
          {cursor.getFullYear()}年{cursor.getMonth() + 1}月
        </h1>
        <button
          className="btn btnSecondary btnSm"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          次月 <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.grid}>
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className={styles.weekday}>
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} className={`${styles.day} ${styles.dayEmpty}`} />;
          const ymd = toYmd(date);
          const dayTasks = tasksByDate.get(ymd) ?? [];
          return (
            <div
              key={i}
              className={`${styles.day} ${ymd === today ? styles.dayToday : ""}`}
            >
              <div className={styles.dayNum}>{date.getDate()}</div>
              {dayTasks.slice(0, 3).map((t) => (
                <Link
                  key={t.id}
                  href={`/parent/tasks/${t.id}`}
                  className={`${styles.taskChip} ${
                    t.completionStatus === "approved" ? styles.taskChipApproved : ""
                  }`}
                >
                  {t.title}
                </Link>
              ))}
              {dayTasks.length > 3 && <div>+{dayTasks.length - 3}</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}
