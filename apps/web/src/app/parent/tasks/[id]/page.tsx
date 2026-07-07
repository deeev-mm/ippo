"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, Star } from "lucide-react";
import { api, type TaskWithMeta } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StatusPill } from "@/components/StatusPill";
import { TaskComments } from "@/components/TaskComments";
import styles from "./page.module.css";

export default function ParentTaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState<TaskWithMeta | null>(null);

  const load = useCallback(async () => {
    setTask(await api.tasks.get(params.id));
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve() {
    await api.tasks.approve(params.id);
    void load();
  }

  async function reject() {
    await api.tasks.reject(params.id);
    void load();
  }

  async function remove() {
    if (!confirm("このタスクを削除しますか？")) return;
    await api.tasks.remove(params.id);
    router.push("/parent/tasks");
  }

  if (!task || !user) return <p className="hint">読み込み中...</p>;

  return (
    <>
      <h1 className="pageTitle">{task.title}</h1>
      <div className={styles.meta}>
        <StatusPill status={task.completionStatus} />
        {task.dueDate && (
          <span>
            <CalendarDays size={14} aria-hidden="true" /> {task.dueDate}
          </span>
        )}
        <span className="pointsChip">
          <Star size={14} aria-hidden="true" /> {task.rewardAmount}pt
        </span>
      </div>

      <div className="card">
        {task.description ? <p>{task.description}</p> : <p className="hint">せつめいはありません</p>}
      </div>

      <div className={styles.actions}>
        {task.completionStatus === "submitted" && (
          <>
            <button className="btn" onClick={approve}>
              承認する
            </button>
            <button className="btn btnSecondary" onClick={reject}>
              やりなおしにする
            </button>
          </>
        )}
        <Link href={`/parent/tasks/${task.id}/edit`} className="btn btnSecondary">
          編集
        </Link>
        <button className="btn btnDanger" onClick={remove}>
          削除
        </button>
      </div>

      <div className="spacer" />
      <TaskComments taskId={task.id} currentUserId={user.id} />
    </>
  );
}
