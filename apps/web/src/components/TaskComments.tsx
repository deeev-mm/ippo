"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { TaskComment } from "@ippo/shared";
import { api } from "@/lib/api";
import styles from "./TaskComments.module.css";

export function TaskComments({ taskId, currentUserId }: { taskId: string; currentUserId: string }) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.comments.list(taskId).then(setComments);
  }, [taskId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    try {
      await api.comments.create(taskId, content.trim());
      setContent("");
      setComments(await api.comments.list(taskId));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2 className={styles.title}>コメント</h2>
      {comments.length === 0 ? (
        <p className="hint">まだコメントはありません</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className={styles.comment}>
            <div>{c.content}</div>
            <div className={styles.commentMeta}>
              {c.userId === currentUserId ? "あなた" : "そのた"} ・{" "}
              {new Date(c.createdAt).toLocaleString("ja-JP")}
            </div>
          </div>
        ))
      )}
      <form onSubmit={onSubmit} className={styles.form}>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="コメントをかく"
          className={styles.input}
        />
        <button type="submit" className="btn btnSm" disabled={busy}>
          送信
        </button>
      </form>
    </div>
  );
}
