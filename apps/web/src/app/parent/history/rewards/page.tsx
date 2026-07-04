"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type RewardBalanceHistoryWithName } from "@/lib/api";
import styles from "../history.module.css";

export default function RewardHistoryPage() {
  const [histories, setHistories] = useState<RewardBalanceHistoryWithName[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.rewardBalance.histories().then((res) => {
      setHistories(res.histories);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <p className={styles.crumbs}>
        <Link href="/parent/master">← せっていにもどる</Link>
      </p>
      <h1 className="pageTitle">ポイント履歴</h1>

      {loading ? (
        <p className="hint">読み込み中...</p>
      ) : histories.length === 0 ? (
        <p className="emptyState">履歴がありません</p>
      ) : (
        histories.map((h) => (
          <div key={h.id} className={`card ${styles.row}`}>
            <div className={styles.rowInfo}>
              <span>{h.amount >= 0 ? "📈" : "📉"}</span>
              <div>
                <div>
                  <strong>{h.userName}</strong>
                </div>
                <div className={styles.rowMeta}>{new Date(h.changedAt).toLocaleString("ja-JP")}</div>
              </div>
            </div>
            <span className={h.amount >= 0 ? styles.amountPositive : styles.amountNegative}>
              {h.amount >= 0 ? "+" : ""}
              {h.amount}pt
            </span>
          </div>
        ))
      )}
    </>
  );
}
