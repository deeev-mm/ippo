"use client";

import { useState } from "react";
import { ChildrenSection } from "./ChildrenSection";
import { CategoriesSection } from "./CategoriesSection";
import { RewardsSection } from "./RewardsSection";
import { BadgesSection } from "./BadgesSection";
import styles from "./master.module.css";

const TABS = [
  { value: "children", label: "こども" },
  { value: "categories", label: "カテゴリ" },
  { value: "rewards", label: "ごほうび" },
  { value: "badges", label: "バッジ" },
] as const;

type Tab = (typeof TABS)[number]["value"];

export default function MasterPage() {
  const [tab, setTab] = useState<Tab>("children");

  return (
    <>
      <h1 className="pageTitle">せってい</h1>
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.value}
            className={`${styles.tab} ${tab === t.value ? styles.tabActive : ""}`}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "children" && <ChildrenSection />}
      {tab === "categories" && <CategoriesSection />}
      {tab === "rewards" && <RewardsSection />}
      {tab === "badges" && <BadgesSection />}
    </>
  );
}
