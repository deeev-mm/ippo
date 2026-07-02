import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// ippoはシングルテナント（1デプロイ = 1家族）。複数家族を扱うfamily概念は持たない。

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    avatar: text("avatar"),
    theme: text("theme"),
    role: text("role").notNull(), // parent | child
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    nameUq: uniqueIndex("users_name_uq").on(t.name),
  }),
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    tokenUq: uniqueIndex("sessions_token_hash_uq").on(t.tokenHash),
    userIdx: index("idx_sessions_user_id").on(t.userId),
    expiresIdx: index("idx_sessions_expires_at").on(t.expiresAt),
  }),
);

export const loginAttempts = sqliteTable(
  "login_attempts",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(), // user
    identifier: text("identifier").notNull(), // 名前を正規化したもの
    failedCount: integer("failed_count").notNull().default(0),
    lockedUntil: text("locked_until"),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    scopeIdentifierUq: uniqueIndex("login_attempts_scope_identifier_uq").on(
      t.scope,
      t.identifier,
    ),
  }),
);

export const taskCategories = sqliteTable(
  "task_categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    slugUq: uniqueIndex("task_categories_slug_uq").on(t.slug),
  }),
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: text("due_date"), // YYYY-MM-DD
    recurrence: text("recurrence"), // daily | weekly | monthly | weekdays | weekends
    parentId: text("parent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    childId: text("child_id").references(() => users.id, { onDelete: "cascade" }),
    taskCategoryId: text("task_category_id").references(() => taskCategories.id, {
      onDelete: "set null",
    }),
    rewardAmount: integer("reward_amount").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    childIdx: index("idx_tasks_child_id").on(t.childId),
    parentIdx: index("idx_tasks_parent_id").on(t.parentId),
    updatedIdx: index("idx_tasks_updated_at").on(t.updatedAt),
  }),
);

export const taskRecurrences = sqliteTable(
  "task_recurrences",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    recurrenceType: text("recurrence_type").notNull(),
    dayOfWeek: integer("day_of_week"), // 0-6
    dayOfMonth: integer("day_of_month"), // 1-31
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    taskIdx: index("idx_task_recurrences_task_id").on(t.taskId),
  }),
);

export const taskSubmissions = sqliteTable(
  "task_submissions",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("submitted"), // submitted | approved | rejected
    submittedAt: text("submitted_at").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    taskIdx: index("idx_task_submissions_task_id").on(t.taskId, t.createdAt),
    userIdx: index("idx_task_submissions_user_id").on(t.userId),
  }),
);

export const taskComments = sqliteTable(
  "task_comments",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    taskIdx: index("idx_task_comments_task_id").on(t.taskId),
  }),
);

export const badges = sqliteTable("badges", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  condition: text("condition").notNull(),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const badgeAssignments = sqliteTable(
  "badge_assignments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending | granted
    assignedAt: text("assigned_at").notNull(),
    receivedAt: text("received_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    userIdx: index("idx_badge_assignments_user_id").on(t.userId),
  }),
);

export const rewards = sqliteTable("rewards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  needReward: integer("need_reward").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const rewardBalances = sqliteTable("reward_balances", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const rewardBalanceHistories = sqliteTable(
  "reward_balance_histories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    changeType: text("change_type").notNull(), // task_approved | reward_request_approved 等
    amount: integer("amount").notNull(),
    relatedId: text("related_id"),
    changedAt: text("changed_at").notNull(),
  },
  (t) => ({
    userIdx: index("idx_reward_balance_histories_user_id").on(t.userId, t.changedAt),
  }),
);

export const rewardRequests = sqliteTable(
  "reward_requests",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rewardId: text("reward_id")
      .notNull()
      .references(() => rewards.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("submitted"), // submitted | approved | rejected
    requestedAt: text("requested_at").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    userIdx: index("idx_reward_requests_user_id").on(t.userId, t.requestedAt),
  }),
);

export const rewardRequestHistories = sqliteTable(
  "reward_request_histories",
  {
    id: text("id").primaryKey(),
    rewardRequestId: text("reward_request_id")
      .notNull()
      .references(() => rewardRequests.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    changedBy: text("changed_by")
      .notNull()
      .references(() => users.id),
    changedAt: text("changed_at").notNull(),
  },
  (t) => ({
    requestIdx: index("idx_reward_request_histories_request_id").on(t.rewardRequestId),
  }),
);

export type User = typeof users.$inferSelect;
export type TaskCategory = typeof taskCategories.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskRecurrence = typeof taskRecurrences.$inferSelect;
export type TaskSubmission = typeof taskSubmissions.$inferSelect;
export type TaskComment = typeof taskComments.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type BadgeAssignment = typeof badgeAssignments.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type RewardBalance = typeof rewardBalances.$inferSelect;
export type RewardBalanceHistory = typeof rewardBalanceHistories.$inferSelect;
export type RewardRequest = typeof rewardRequests.$inferSelect;
export type RewardRequestHistory = typeof rewardRequestHistories.$inferSelect;
