"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, type Child, type TaskListResponse } from "@/lib/api";
import { StatusPill } from "@/components/StatusPill";
import styles from "../history.module.css";

const TABS = [
  { value: "approved", label: "かんりょう" },
  { value: "rejected", label: "やりなおし" },
];

export default function TaskHistoryPage() {
  const [status, setStatus] = useState("approved");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<TaskListResponse | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, childList] = await Promise.all([
      api.tasks.list({ status, page: String(page) }),
      api.children.list(),
    ]);
    setResult(res);
    setChildren(childList);
    setLoading(false);
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const childName = (id: string | null) => children.find((c) => c.id === id)?.name ?? "-";

  return (
    <>
      <p className={styles.crumbs}>
        <Link href="/parent/master">← せっていにもどる</Link>
      </p>
      <h1 className="pageTitle">タスク履歴</h1>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.value}
            className={`${styles.tab} ${status === t.value ? styles.tabActive : ""}`}
            onClick={() => {
              setStatus(t.value);
              setPage(1);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="hint">読み込み中...</p>
      ) : !result || result.data.length === 0 ? (
        <p className="emptyState">履歴がありません</p>
      ) : (
        <>
          {result.data.map((task) => (
            <div key={task.id} className={`card ${styles.row}`}>
              <div>
                <strong>{task.title}</strong>
                <div className={styles.rowMeta}>
                  {childName(task.childId)} ・ ⭐{task.rewardAmount}pt ・{" "}
                  {task.latestSubmission &&
                    new Date(task.latestSubmission.submittedAt).toLocaleDateString("ja-JP")}
                </div>
              </div>
              <StatusPill status={task.completionStatus} />
            </div>
          ))}

          {result.lastPage > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16 }}>
              <button
                className="btn btnSecondary btnSm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← 前へ
              </button>
              <span className="hint">
                {page} / {result.lastPage}
              </span>
              <button
                className="btn btnSecondary btnSm"
                disabled={page >= result.lastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                次へ →
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
