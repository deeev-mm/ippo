"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { RecurrenceType } from "@ippo/shared";
import { api, type Child } from "@/lib/api";
import type { TaskCategory } from "@ippo/shared";
import styles from "./TaskForm.module.css";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export type TaskFormValues = {
  title: string;
  description: string;
  due_date: string;
  recurrence: RecurrenceType | "";
  reward_amount: number;
  child_id: string;
  task_category_id: string;
  weekdays: number[];
};

export function TaskForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<TaskFormValues>;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}) {
  const [children, setChildren] = useState<Child[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [recurrence, setRecurrence] = useState<RecurrenceType | "">(initial?.recurrence ?? "");
  const [days, setDays] = useState<number[]>(initial?.weekdays ?? []);
  const [rewardAmount, setRewardAmount] = useState(initial?.reward_amount ?? 0);
  const [childId, setChildId] = useState(initial?.child_id ?? "");
  const [categoryId, setCategoryId] = useState(initial?.task_category_id ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, cat] = await Promise.all([api.children.list(), api.taskCategories.list()]);
      setChildren(c);
      setCategories(cat);
    })();
  }, []);

  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit({
        title,
        description,
        due_date: dueDate,
        recurrence,
        reward_amount: rewardAmount,
        child_id: childId,
        task_category_id: categoryId,
        weekdays: recurrence === "weekly" || recurrence === "monthly" ? days : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}

      <div className="field">
        <label htmlFor="title">タイトル</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="field">
        <label htmlFor="description">せつめい</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="child">だれの？</label>
        <select id="child" value={childId} onChange={(e) => setChildId(e.target.value)}>
          <option value="">えらんでください</option>
          {children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.avatar} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="category">カテゴリ</label>
        <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">なし</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="due_date">きげん</label>
        <input
          id="due_date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="recurrence">くりかえし</label>
        <select
          id="recurrence"
          value={recurrence}
          onChange={(e) => {
            setRecurrence(e.target.value as RecurrenceType | "");
            setDays([]);
          }}
        >
          <option value="">なし</option>
          <option value="daily">毎日</option>
          <option value="weekly">毎週（曜日をえらぶ）</option>
          <option value="monthly">毎月（日にちをえらぶ）</option>
          <option value="weekdays">平日</option>
          <option value="weekends">土日</option>
        </select>
      </div>

      {recurrence === "weekly" && (
        <div className={styles.dayGrid}>
          {WEEKDAY_LABELS.map((label, i) => (
            <button
              type="button"
              key={i}
              className={`${styles.dayBtn} ${days.includes(i) ? styles.dayBtnActive : ""}`}
              onClick={() => toggleDay(i)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {recurrence === "monthly" && (
        <div className={`${styles.dayGrid} ${styles.dayGridMonth}`}>
          {MONTH_DAYS.map((d) => (
            <button
              type="button"
              key={d}
              className={`${styles.dayBtn} ${days.includes(d) ? styles.dayBtnActive : ""}`}
              onClick={() => toggleDay(d)}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      <div className="field">
        <label htmlFor="reward">ポイント</label>
        <input
          id="reward"
          type="number"
          min={0}
          value={rewardAmount}
          onChange={(e) => setRewardAmount(Number(e.target.value))}
        />
      </div>

      <div className={styles.actions}>
        <button type="submit" className="btn btnBlock" disabled={busy}>
          {busy ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
