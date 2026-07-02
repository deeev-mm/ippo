"use client";

import { useRouter } from "next/navigation";
import { TaskForm, type TaskFormValues } from "@/components/TaskForm";
import { api } from "@/lib/api";

export default function NewTaskPage() {
  const router = useRouter();

  async function handleSubmit(values: TaskFormValues) {
    await api.tasks.create({
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

  return (
    <>
      <h1 className="pageTitle">タスクをつくる</h1>
      <div className="card">
        <TaskForm submitLabel="つくる" onSubmit={handleSubmit} />
      </div>
    </>
  );
}
