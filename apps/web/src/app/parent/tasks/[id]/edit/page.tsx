"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TaskForm, type TaskFormValues } from "@/components/TaskForm";
import { api, type TaskWithMeta } from "@/lib/api";

export default function EditTaskPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<TaskWithMeta | null>(null);

  useEffect(() => {
    api.tasks.get(params.id).then(setTask);
  }, [params.id]);

  async function handleSubmit(values: TaskFormValues) {
    await api.tasks.update(params.id, {
      title: values.title,
      description: values.description || null,
      due_date: values.due_date || null,
      recurrence: values.recurrence || null,
      reward_amount: values.reward_amount,
      child_id: values.child_id || null,
      task_category_id: values.task_category_id || null,
      weekdays: values.weekdays,
    });
    router.push("/parent/tasks");
  }

  if (!task) return <p className="hint">読み込み中...</p>;

  return (
    <>
      <h1 className="pageTitle">タスクをへんしゅう</h1>
      <div className="card">
        <TaskForm
          submitLabel="ほぞんする"
          initial={{
            title: task.title,
            description: task.description ?? "",
            due_date: task.dueDate ?? "",
            recurrence: (task.recurrence as TaskFormValues["recurrence"]) ?? "",
            reward_amount: task.rewardAmount,
            child_id: task.childId ?? "",
            task_category_id: task.taskCategoryId ?? "",
            weekdays: task.recurringDays.map(Number),
          }}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}
