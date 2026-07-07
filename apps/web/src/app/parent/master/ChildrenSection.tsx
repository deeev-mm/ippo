"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, type Child } from "@/lib/api";
import { AVATAR_ICONS, DEFAULT_AVATAR_ICON } from "@/lib/icons";
import { Icon } from "@/components/Icon";
import { IconPicker } from "@/components/IconPicker";
import styles from "./master.module.css";

const EMPTY = { name: "", password: "", icon: DEFAULT_AVATAR_ICON as string, colorTheme: "blue" };

export function ChildrenSection() {
  const [children, setChildren] = useState<Child[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = useCallback(async () => setChildren(await api.children.list()), []);
  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(child: Child) {
    setEditingId(child.id);
    setForm({
      name: child.name,
      password: "",
      icon: child.avatar ?? DEFAULT_AVATAR_ICON,
      colorTheme: child.theme ?? "blue",
    });
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
        await api.children.update(editingId, {
          name: form.name,
          avatar: form.icon,
          theme: form.colorTheme,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await api.children.create(form);
      }
      resetForm();
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  }

  async function remove(id: string) {
    if (!confirm("この子どもアカウントを削除しますか？")) return;
    await api.children.remove(id);
    void load();
  }

  return (
    <>
      {children.map((c) => (
        <div key={c.id} className={`card ${styles.row}`}>
          <div className={styles.rowInfo}>
            <span className="avatar">
              <Icon name={c.avatar} size={20} />
            </span>
            <span>{c.name}</span>
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
          {editingId ? "子どもをへんしゅう" : "子どもをついかする"}
        </h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={onSubmit}>
          <div className={styles.formGrid}>
            <div className="field">
              <label>なまえ</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label>パスワード{editingId && "（かえるときだけ）"}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingId}
              />
            </div>
            <div className="field">
              <label>テーマカラー</label>
              <select value={form.colorTheme} onChange={(e) => setForm({ ...form, colorTheme: e.target.value })}>
                <option value="blue">ブルー</option>
                <option value="pink">ピンク</option>
                <option value="green">グリーン</option>
                <option value="purple">パープル</option>
                <option value="orange">オレンジ</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>アイコン</label>
            <IconPicker
              options={AVATAR_ICONS}
              value={form.icon}
              onChange={(icon) => setForm({ ...form, icon })}
            />
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
