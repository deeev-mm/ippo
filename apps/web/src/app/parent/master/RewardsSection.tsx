"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import type { Reward } from "@ippo/shared";
import { api } from "@/lib/api";
import { DEFAULT_REWARD_ICON, REWARD_ICONS } from "@/lib/icons";
import { Icon } from "@/components/Icon";
import { IconPicker } from "@/components/IconPicker";
import styles from "./master.module.css";

const EMPTY = { name: "", icon: DEFAULT_REWARD_ICON as string, need_reward: 10 };

export function RewardsSection() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = useCallback(async () => setRewards(await api.rewards.list()), []);
  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(r: Reward) {
    setEditingId(r.id);
    setForm({ name: r.name, icon: r.icon, need_reward: r.needReward });
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
        await api.rewards.update(editingId, form);
      } else {
        await api.rewards.create(form);
      }
      resetForm();
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  }

  async function remove(id: string) {
    if (!confirm("このごほうびを削除しますか？")) return;
    await api.rewards.remove(id);
    void load();
  }

  return (
    <>
      {rewards.map((r) => (
        <div key={r.id} className={`card ${styles.row}`}>
          <div className={styles.rowInfo}>
            <Icon name={r.icon} size={20} />
            <strong>{r.name}</strong>
            <span className="pointsChip">
              <Star size={14} aria-hidden="true" /> {r.needReward}pt
            </span>
          </div>
          <div className={styles.rowActions}>
            <button className="btn btnSecondary btnSm" onClick={() => startEdit(r)}>
              編集
            </button>
            <button className="btn btnDanger btnSm" onClick={() => remove(r.id)}>
              削除
            </button>
          </div>
        </div>
      ))}

      <div className="card">
        <h2 style={{ fontSize: "1rem", marginBottom: 10 }}>
          {editingId ? "ごほうびをへんしゅう" : "ごほうびをついかする"}
        </h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={onSubmit}>
          <div className={styles.formGrid}>
            <div className="field">
              <label>なまえ</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label>必要ポイント</label>
              <input
                type="number"
                min={0}
                value={form.need_reward}
                onChange={(e) => setForm({ ...form, need_reward: Number(e.target.value) })}
                required
              />
            </div>
          </div>
          <div className="field">
            <label>アイコン</label>
            <IconPicker
              options={REWARD_ICONS}
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
