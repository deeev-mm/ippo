"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Reward } from "@ippo/shared";
import { api, type RewardRequestWithMeta } from "@/lib/api";
import { Icon } from "@/components/Icon";
import styles from "./page.module.css";

export default function ParentRewardsPage() {
  const [balances, setBalances] = useState<{ user_id: string; name: string; balance: number }[]>([]);
  const [requests, setRequests] = useState<RewardRequestWithMeta[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [b, r, rw] = await Promise.all([
      api.rewardBalance.all(),
      api.rewardRequests.list({ status: "submitted" }),
      api.rewards.list(),
    ]);
    setBalances(b.balances);
    setRequests(r.requests);
    setRewards(rw);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(id: string) {
    await api.rewardRequests.approve(id);
    void load();
  }

  async function reject(id: string) {
    await api.rewardRequests.reject(id);
    void load();
  }

  if (loading) return <p className="hint">読み込み中...</p>;

  return (
    <>
      <h1 className="pageTitle">ごほうび</h1>

      <p className={styles.section}>こどものポイント</p>
      {balances.map((b) => (
        <div key={b.user_id} className={`card ${styles.rewardRow}`}>
          <span>{b.name}</span>
          <span className="pointsChip">
            <Star size={14} aria-hidden="true" /> {b.balance}pt
          </span>
        </div>
      ))}

      <p className={styles.section}>申請中のごほうび ({requests.length})</p>
      {requests.length === 0 ? (
        <p className="emptyState">申請はありません</p>
      ) : (
        requests.map((r) => (
          <div key={r.id} className={`card ${styles.requestRow}`}>
            <div className={styles.requestInfo}>
              <strong className={styles.iconLabel}>
                <Icon name={r.reward.icon} size={16} /> {r.reward.name}
              </strong>
              <span className="hint">
                {r.user.name} ・ 必要 {r.reward.needReward}pt
              </span>
            </div>
            <div className={styles.requestActions}>
              <button className="btn btnSm" onClick={() => approve(r.id)}>
                承認
              </button>
              <button className="btn btnSecondary btnSm" onClick={() => reject(r.id)}>
                却下
              </button>
            </div>
          </div>
        ))
      )}

      <p className={styles.section}>ごほうびカタログ</p>
      {rewards.map((r) => (
        <div key={r.id} className={`card ${styles.rewardRow}`}>
          <span className={styles.iconLabel}>
            <Icon name={r.icon} size={16} /> {r.name}
          </span>
          <span className="pointsChip">
            <Star size={14} aria-hidden="true" /> {r.needReward}pt
          </span>
        </div>
      ))}
      <Link href="/parent/master" className="btn btnSecondary btnBlock">
        ごほうびをへんしゅうする
      </Link>
    </>
  );
}
