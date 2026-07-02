export type UserRole = "parent" | "child";

export type RecurrenceType = "daily" | "weekly" | "monthly" | "weekdays" | "weekends";

export type SubmissionStatus = "submitted" | "approved" | "rejected";

export type BadgeAssignmentStatus = "pending" | "granted";

export type SessionUser = {
  id: string;
  name: string;
  avatar: string | null;
  theme: string | null;
  role: UserRole;
};

export type User = SessionUser;

export type TaskCategory = {
  id: string;
  name: string;
  slug: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  recurrence: RecurrenceType | null;
  parentId: string;
  childId: string | null;
  taskCategoryId: string | null;
  rewardAmount: number;
  createdAt: string;
  updatedAt: string;
  recurringDays: string[];
};

export type TaskSubmission = {
  id: string;
  taskId: string;
  userId: string;
  status: SubmissionStatus;
  submittedAt: string;
};

export type TaskComment = {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
};

export type Badge = {
  id: string;
  name: string;
  icon: string;
  condition: string;
  isActive: boolean;
};

export type BadgeAssignment = {
  id: string;
  userId: string;
  badgeId: string;
  status: BadgeAssignmentStatus;
  assignedAt: string;
  receivedAt: string | null;
};

export type Reward = {
  id: string;
  name: string;
  icon: string;
  needReward: number;
};

export type RewardBalance = {
  userId: string;
  balance: number;
};

export type RewardBalanceHistory = {
  id: string;
  userId: string;
  changeType: string;
  amount: number;
  relatedId: string | null;
  changedAt: string;
};

export type RewardRequest = {
  id: string;
  userId: string;
  rewardId: string;
  status: SubmissionStatus;
  requestedAt: string;
};

export const MIN_PASSWORD_LENGTH = 4;

export function isParent(role: UserRole): boolean {
  return role === "parent";
}

export function isChild(role: UserRole): boolean {
  return role === "child";
}

/** recurrence種別ごとに、繰り返し対象の値(曜日 0-6 or 日付 1-31)を文字列で返す */
export function recurrenceDayValues(
  recurrence: RecurrenceType,
  recurrences: { dayOfWeek: number | null; dayOfMonth: number | null }[],
): string[] {
  return recurrences.map((r) =>
    recurrence === "monthly" ? String(r.dayOfMonth) : String(r.dayOfWeek),
  );
}
