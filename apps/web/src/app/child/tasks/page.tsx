"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, MessageCircle, Star } from "lucide-react";
import { api, type TaskListResponse } from "@/lib/api";
import { StatusPill } from "@/components/StatusPill";
import styles from "./page.module.css";

const TABS = [
  { value: "", label: "すべて" },
  { value: "active", label: "みてない" },
  { value: "submitted", label: "かくにん中" },
  { value: "approved", label: "かんりょう" },
  { value: "rejected", label: "やりなおし" },
];

export default function ChildTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [result, setResult] = useState<TaskListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), exclude_past_approved: "1" };
    if (status) params.status = status;
    setResult(await api.tasks.list(params));
    setLoading(false);
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function setStatus(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    router.push(`/child/tasks?${params}`);
  }

  function setPage(next: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(next));
    router.push(`/child/tasks?${params}`);
  }

  async function submit(taskId: string) {
    await api.tasks.submit(taskId);
    void load();
  }

  return (
    <>
      <h1 className="pageTitle">タスク</h1>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.value}
            className={`${styles.tab} ${status === t.value ? styles.tabActive : ""}`}
            onClick={() => setStatus(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="hint">読み込み中...</p>
      ) : !result || result.data.length === 0 ? (
        <p className="emptyState">タスクがありません</p>
      ) : (
        <>
          {result.data.map((task) => (
            <div key={task.id} className="card">
              <Link href={`/child/tasks/${task.id}`} className={styles.taskRow}>
                <div className={styles.taskTop}>
                  <span className={styles.taskTitle}>{task.title}</span>
                  <StatusPill status={task.completionStatus} />
                </div>
                <div className={styles.taskMeta}>
                  {task.dueDate && (
                    <span>
                      <CalendarDays size={14} aria-hidden="true" /> {task.dueDate}
                    </span>
                  )}
                  <span>
                    <Star size={14} aria-hidden="true" /> {task.rewardAmount}pt
                  </span>
                  {task.commentsCount > 0 && (
                    <span>
                      <MessageCircle size={14} aria-hidden="true" /> {task.commentsCount}
                    </span>
                  )}
                </div>
              </Link>
              {task.completionStatus !== "submitted" && task.completionStatus !== "approved" && (
                <div className={styles.taskActions}>
                  <button className="btn btnSm" onClick={() => submit(task.id)}>
                    できた！
                  </button>
                </div>
              )}
            </div>
          ))}

          {result.lastPage > 1 && (
            <div className={styles.pagination}>
              <button
                className="btn btnSecondary btnSm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} aria-hidden="true" /> 前へ
              </button>
              <span>
                {page} / {result.lastPage}
              </span>
              <button
                className="btn btnSecondary btnSm"
                disabled={page >= result.lastPage}
                onClick={() => setPage(page + 1)}
              >
                次へ <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
