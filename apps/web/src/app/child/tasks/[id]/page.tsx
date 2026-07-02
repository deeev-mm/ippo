"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type TaskWithMeta } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StatusPill } from "@/components/StatusPill";
import { TaskComments } from "@/components/TaskComments";
import styles from "./page.module.css";

export default function ChildTaskDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<TaskWithMeta | null>(null);

  const load = useCallback(async () => {
    setTask(await api.tasks.get(params.id));
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    await api.tasks.submit(params.id);
    void load();
  }

  if (!task || !user) return <p className="hint">読み込み中...</p>;

  const canSubmit = task.completionStatus !== "submitted" && task.completionStatus !== "approved";

  return (
    <>
      <h1 className="pageTitle">{task.title}</h1>
      <div className={styles.meta}>
        <StatusPill status={task.completionStatus} />
        {task.dueDate && <span>📅 {task.dueDate}</span>}
        <span className="pointsChip">⭐ {task.rewardAmount}pt</span>
      </div>

      <div className="card">
        {task.description ? <p>{task.description}</p> : <p className="hint">せつめいはありません</p>}
      </div>

      {canSubmit && (
        <div className={styles.actions}>
          <button className="btn btnBlock" onClick={submit}>
            できた！
          </button>
        </div>
      )}

      <div className="spacer" />
      <TaskComments taskId={task.id} currentUserId={user.id} />
    </>
  );
}
