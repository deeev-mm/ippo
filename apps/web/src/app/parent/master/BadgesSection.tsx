"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Badge, TaskCategory } from "@ippo/shared";
import { api } from "@/lib/api";
import styles from "./master.module.css";

type Kind = "task_approve" | "badge_own_count";

const EMPTY = { name: "", icon: "🏅", kind: "task_approve" as Kind, gte: 1, category: "" };

function parseCondition(raw: string): typeof EMPTY {
  try {
    const c = JSON.parse(raw);
    if (c.task_approve?.gte != null) {
      return { ...EMPTY, kind: "task_approve", gte: c.task_approve.gte, category: c.task_approve.category ?? "" };
    }
    if (c.badge_own_count?.gte != null) {
      return { ...EMPTY, kind: "badge_own_count", gte: c.badge_own_count.gte };
    }
  } catch {
    // ignore malformed condition
  }
  return EMPTY;
}

function buildCondition(form: typeof EMPTY): string {
  if (form.kind === "task_approve") {
    return JSON.stringify({
      task_approve: { gte: form.gte, ...(form.category ? { category: form.category } : {}) },
    });
  }
  return JSON.stringify({ badge_own_count: { gte: form.gte } });
}

function describeCondition(raw: string): string {
  try {
    const c = JSON.parse(raw);
    if (c.task_approve?.gte != null) {
      return `タスク${c.task_approve.gte}回完了${c.task_approve.category ? `（${c.task_approve.category}）` : ""}`;
    }
    if (c.badge_own_count?.gte != null) return `バッジ${c.badge_own_count.gte}個所持`;
  } catch {
    // ignore
  }
  return raw;
}

export function BadgesSection() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [b, c] = await Promise.all([api.badges.list(), api.taskCategories.list()]);
    setBadges(b);
    setCategories(c);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(b: Badge) {
    setEditingId(b.id);
    setForm({ ...parseCondition(b.condition), name: b.name, icon: b.icon });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const payload = { name: form.name, icon: form.icon, condition: buildCondition(form) };
    try {
      if (editingId) {
        await api.badges.update(editingId, payload);
      } else {
        await api.badges.create(payload);
      }
      resetForm();
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  }

  async function toggleActive(b: Badge) {
    await api.badges.update(b.id, { is_active: !b.isActive });
    void load();
  }

  async function remove(id: string) {
    if (!confirm("このバッジを削除しますか？")) return;
    await api.badges.remove(id);
    void load();
  }

  return (
    <>
      {badges.map((b) => (
        <div key={b.id} className={`card ${styles.row}`}>
          <div className={styles.rowInfo}>
            <span>{b.icon}</span>
            <div>
              <div>
                <strong>{b.name}</strong>
              </div>
              <div className="hint">{describeCondition(b.condition)}</div>
            </div>
          </div>
          <div className={styles.rowActions}>
            <button className="btn btnSecondary btnSm" onClick={() => toggleActive(b)}>
              {b.isActive ? "有効" : "無効"}
            </button>
            <button className="btn btnSecondary btnSm" onClick={() => startEdit(b)}>
              編集
            </button>
            <button className="btn btnDanger btnSm" onClick={() => remove(b.id)}>
              削除
            </button>
          </div>
        </div>
      ))}

      <div className="card">
        <h2 style={{ fontSize: "1rem", marginBottom: 10 }}>
          {editingId ? "バッジをへんしゅう" : "バッジをついかする"}
        </h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={onSubmit}>
          <div className={styles.formGrid}>
            <div className="field">
              <label>なまえ</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label>アイコン（絵文字）</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} required />
            </div>
          </div>

          <div className="field">
            <label>じょうけん</label>
            <div className={styles.radioRow}>
              <label>
                <input
                  type="radio"
                  checked={form.kind === "task_approve"}
                  onChange={() => setForm({ ...form, kind: "task_approve" })}
                />{" "}
                タスク完了回数
              </label>
              <label>
                <input
                  type="radio"
                  checked={form.kind === "badge_own_count"}
                  onChange={() => setForm({ ...form, kind: "badge_own_count" })}
                />{" "}
                バッジ所持数
              </label>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className="field">
              <label>{form.kind === "task_approve" ? "何回以上で完了" : "何個以上所持で完了"}</label>
              <input
                type="number"
                min={1}
                value={form.gte}
                onChange={(e) => setForm({ ...form, gte: Number(e.target.value) })}
              />
            </div>
            {form.kind === "task_approve" && (
              <div className="field">
                <label>カテゴリ限定（にんい）</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">指定しない</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button type="submit" className="btn btnSm">
              {editingId ? "ほぞんする" : "ついかする"}
            </button>
            {editingId && (
              <button type="button" className="btn btnSecondary btnSm" onClick={resetForm}>
                キャンセル
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
