"use client";

import { Icon } from "./Icon";
import type { IconName } from "@/lib/icons";
import styles from "./IconPicker.module.css";

export function IconPicker({
  options,
  value,
  onChange,
}: {
  options: IconName[];
  value: string;
  onChange: (name: IconName) => void;
}) {
  return (
    <div className={styles.grid}>
      {options.map((name) => (
        <button
          type="button"
          key={name}
          className={`${styles.item} ${value === name ? styles.itemActive : ""}`}
          onClick={() => onChange(name)}
          aria-label={name}
          aria-pressed={value === name}
        >
          <Icon name={name} size={22} />
        </button>
      ))}
    </div>
  );
}
