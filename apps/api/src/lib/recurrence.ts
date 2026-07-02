import type { RecurrenceType } from "@ippo/shared";

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** 現在のdue_dateと繰り返し設定から、次回のdue_dateを計算する（daily/weekly/monthly/weekdays/weekends対応） */
export function calculateNextDueDate(
  dueDate: string,
  recurrence: RecurrenceType,
  recurrences: { dayOfWeek: number | null; dayOfMonth: number | null }[],
): string | null {
  const current = new Date(`${dueDate}T00:00:00Z`);

  if (recurrence === "weekly" || recurrence === "monthly") {
    if (!recurrences.length) return null;

    if (recurrence === "weekly") {
      const daysOfWeek = recurrences
        .map((r) => r.dayOfWeek)
        .filter((d): d is number => d != null);
      if (!daysOfWeek.length) return null;
      for (let i = 1; i <= 7; i++) {
        const candidate = addDays(current, i);
        if (daysOfWeek.includes(candidate.getUTCDay())) return toYmd(candidate);
      }
      return null;
    }

    const daysOfMonth = recurrences
      .map((r) => r.dayOfMonth)
      .filter((d): d is number => d != null);
    if (!daysOfMonth.length) return null;
    for (let i = 1; i <= 31; i++) {
      const candidate = addDays(current, i);
      if (daysOfMonth.includes(candidate.getUTCDate())) return toYmd(candidate);
    }
    return null;
  }

  switch (recurrence) {
    case "daily":
      return toYmd(addDays(current, 1));
    case "weekdays": {
      let next = addDays(current, 1);
      while (next.getUTCDay() === 0 || next.getUTCDay() === 6) next = addDays(next, 1);
      return toYmd(next);
    }
    case "weekends": {
      if (current.getUTCDay() === 6) return toYmd(addDays(current, 1));
      let next = addDays(current, 1);
      while (next.getUTCDay() !== 6) next = addDays(next, 1);
      return toYmd(next);
    }
    default:
      return null;
  }
}
