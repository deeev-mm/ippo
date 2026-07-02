"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { TaskCategory } from "@ippo/shared";
import { api } from "@/lib/api";
import styles from "./master.module.css";

const EMPTY = { name: "", slug: "" };

export function CategoriesSection() {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = useCallback(async () => setCategories(await api.taskCategories.list()), []);
  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(c: TaskCategory) {
    setEditingId(c.id);
    setForm({ name: c.name, slug: c.slug });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.taskCategories.update(editingId, form);
      } else {
        await api.taskCategories.create(form);
      }
      resetForm();
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  }

  async function remove(id: string) {
    if (!confirm("このカテゴリを削除しますか？")) return;
    await api.taskCategories.remove(id);
    void load();
  }

  return (
    <>
      {categories.map((c) => (
        <div key={c.id} className={`card ${styles.row}`}>
          <div className={styles.rowInfo}>
            <strong>{c.name}</strong>
            <span className="hint">{c.slug}</span>
          </div>
          <div className={styles.rowActions}>
            <button className="btn btnSecondary btnSm" onClick={() => startEdit(c)}>
              編集
            </button>
            <button className="btn btnDanger btnSm" onClick={() => remove(c.id)}>
              削除
            </button>
          </div>
        </div>
      ))}

      <div className="card">
        <h2 style={{ fontSize: "1rem", marginBottom: 10 }}>
          {editingId ? "カテゴリをへんしゅう" : "カテゴリをついかする"}
        </h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={onSubmit}>
          <div className={styles.formGrid}>
            <div className="field">
              <label>なまえ</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label>スラッグ（英数字）</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
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
