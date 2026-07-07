"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, MessageCircle, Plus, Star } from "lucide-react";
import { api, type Child, type TaskListResponse } from "@/lib/api";
import { StatusPill } from "@/components/StatusPill";
import { Icon } from "@/components/Icon";
import styles from "./page.module.css";

const TABS = [
  { value: "", label: "すべて" },
  { value: "active", label: "みてない" },
  { value: "submitted", label: "かくにん待ち" },
  { value: "approved", label: "かんりょう" },
  { value: "rejected", label: "やりなおし" },
];

export default function ParentTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [result, setResult] = useState<TaskListResponse | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), exclude_past_approved: "1" };
    if (status) params.status = status;
    const [res, childList] = await Promise.all([api.tasks.list(params), api.children.list()]);
    setResult(res);
    setChildren(childList);
    setLoading(false);
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function setStatus(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    router.push(`/parent/tasks?${params}`);
  }

  function setPage(next: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(next));
    router.push(`/parent/tasks?${params}`);
  }

  async function approve(taskId: string) {
    await api.tasks.approve(taskId);
    void load();
  }

  async function reject(taskId: string) {
    await api.tasks.reject(taskId);
    void load();
  }

  async function remove(taskId: string) {
    if (!confirm("このタスクを削除しますか？")) return;
    await api.tasks.remove(taskId);
    void load();
  }

  const childName = (id: string | null) => children.find((c) => c.id === id)?.name ?? "-";
  const childAvatar = (id: string | null) => children.find((c) => c.id === id)?.avatar ?? null;

  return (
    <>
      <div className={styles.header}>
        <h1 className="pageTitle">タスク</h1>
        <Link href="/parent/tasks/new" className="btn btnSm">
          <Plus size={16} aria-hidden="true" /> つくる
        </Link>
      </div>

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
              <Link href={`/parent/tasks/${task.id}`} className={styles.taskRow}>
                <div className={styles.taskTop}>
                  <span className={styles.taskTitle}>{task.title}</span>
                  <StatusPill status={task.completionStatus} />
                </div>
                <div className={styles.taskMeta}>
                  <span>
                    <Icon name={childAvatar(task.childId)} size={14} /> {childName(task.childId)}
                  </span>
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
              <div className={styles.taskActions}>
                {task.completionStatus === "submitted" && (
                  <>
                    <button className="btn btnSm" onClick={() => approve(task.id)}>
                      承認する
                    </button>
                    <button className="btn btnSecondary btnSm" onClick={() => reject(task.id)}>
                      やりなおし
                    </button>
                  </>
                )}
                <Link href={`/parent/tasks/${task.id}/edit`} className="btn btnSecondary btnSm">
                  編集
                </Link>
                <button className="btn btnDanger btnSm" onClick={() => remove(task.id)}>
                  削除
                </button>
              </div>
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
