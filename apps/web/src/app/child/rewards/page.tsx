"use client";

import { useCallback, useEffect, useState } from "react";
import type { Reward } from "@ippo/shared";
import { api, type RewardRequestWithMeta } from "@/lib/api";
import { StatusPill } from "@/components/StatusPill";
import styles from "./page.module.css";

export default function ChildRewardsPage() {
  const [balance, setBalance] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [requests, setRequests] = useState<RewardRequestWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [b, r, req] = await Promise.all([
      api.rewardBalance.mine(),
      api.rewards.list(),
      api.rewardRequests.list(),
    ]);
    setBalance(b.balance);
    setRewards(r);
    setRequests(req.requests);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function request(rewardId: string) {
    setError("");
    try {
      await api.rewardRequests.create(rewardId);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "申請に失敗しました");
    }
  }

  if (loading) return <p className="hint">読み込み中...</p>;

  return (
    <>
      <h1 className="pageTitle">ごほうび</h1>
      <div className="card" style={{ textAlign: "center" }}>
        <span className="pointsChip" style={{ fontSize: "1.2rem" }}>
          ⭐ {balance}pt
        </span>
      </div>

      {error && <p className="error">{error}</p>}

      <p className={styles.section}>ごほうびカタログ</p>
      {rewards.map((r) => (
        <div key={r.id} className={`card ${styles.rewardRow}`}>
          <div className={styles.rewardInfo}>
            <span>{r.icon}</span>
            <strong>{r.name}</strong>
          </div>
          <button className="btn btnSm" disabled={balance < r.needReward} onClick={() => request(r.id)}>
            {r.needReward}pt で申請
          </button>
        </div>
      ))}

      <p className={styles.section}>申請したごほうび</p>
      {requests.length === 0 ? (
        <p className="emptyState">まだ申請していません</p>
      ) : (
        requests.map((r) => (
          <div key={r.id} className={`card ${styles.requestRow}`}>
            <span>
              {r.reward.icon} {r.reward.name}
            </span>
            <StatusPill status={r.status} />
          </div>
        ))
      )}
    </>
  );
}
