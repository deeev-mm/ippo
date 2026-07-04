import type {
  Badge,
  BadgeAssignment,
  Reward,
  RewardBalanceHistory,
  RewardRequest,
  SessionUser,
  Task,
  TaskCategory,
  TaskComment,
  TaskSubmission,
} from "@ippo/shared";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8787";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { error?: string; message?: string }).error ||
      (data as { error?: string; message?: string }).message ||
      `リクエストに失敗しました (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export type TaskWithMeta = Task & {
  isRecurring: boolean;
  recurringType: string | null;
  recurringDays: string[];
  commentsCount: number;
  completionStatus: TaskSubmission["status"] | null;
  latestSubmission: TaskSubmission | null;
};

export type TaskListResponse = {
  data: TaskWithMeta[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
};

export type Child = {
  id: string;
  name: string;
  theme: string | null;
  avatar: string | null;
};

export type RewardRequestWithMeta = RewardRequest & {
  reward: Reward;
  user: { id: string; name: string };
};

export type BadgeAssignmentWithBadge = BadgeAssignment & { badge: Badge; userName?: string };

export type RewardBalanceHistoryWithName = RewardBalanceHistory & { userName: string };

export type ProgressReport = {
  days: string[];
  children: { id: string; name: string; avatar: string | null }[];
  completed: Record<string, number[]>;
  points: Record<string, number[]>;
};

export const api = {
  // auth
  login: (name: string, password: string) =>
    request<{ user: SessionUser }>("/auth/login", { method: "POST", json: { name, password } }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  me: () => request<{ user: SessionUser }>("/auth/me"),

  // children
  children: {
    list: () => request<Child[]>("/children"),
    create: (data: { name: string; password: string; icon?: string; colorTheme?: string }) =>
      request<Child>("/children", { method: "POST", json: data }),
    update: (
      id: string,
      data: Partial<{ name: string; password: string; avatar: string; theme: string }>,
    ) => request<Child>(`/children/${id}`, { method: "PUT", json: data }),
    remove: (id: string) => request<{ message: string }>(`/children/${id}`, { method: "DELETE" }),
  },

  // task categories
  taskCategories: {
    list: () => request<TaskCategory[]>("/task-categories"),
    create: (data: { name: string; slug: string }) =>
      request<TaskCategory>("/task-categories", { method: "POST", json: data }),
    update: (id: string, data: Partial<{ name: string; slug: string }>) =>
      request<{ message: string }>(`/task-categories/${id}`, { method: "PUT", json: data }),
    remove: (id: string) =>
      request<{ message: string }>(`/task-categories/${id}`, { method: "DELETE" }),
  },

  // tasks
  tasks: {
    list: (params: Record<string, string> = {}) =>
      request<TaskListResponse>(`/tasks?${new URLSearchParams(params)}`),
    get: (id: string) => request<TaskWithMeta>(`/tasks/${id}`),
    today: () => request<TaskWithMeta[]>("/tasks/today"),
    weekday: () => request<{ task_completed: number; points_earned: number }>("/tasks/weekday"),
    calendar: (params: Record<string, string> = {}) =>
      request<TaskWithMeta[]>(`/calendar-tasks?${new URLSearchParams(params)}`),
    create: (data: Record<string, unknown>) =>
      request<TaskWithMeta>("/tasks", { method: "POST", json: data }),
    update: (id: string, data: Record<string, unknown>) =>
      request<TaskWithMeta>(`/tasks/${id}`, { method: "PUT", json: data }),
    remove: (id: string) => request<{ message: string }>(`/tasks/${id}`, { method: "DELETE" }),
    submit: (id: string) => request<TaskSubmission>(`/tasks/${id}/submit`, { method: "POST" }),
    approve: (taskId: string) =>
      request<TaskSubmission>(`/task-submissions/${taskId}/approve`, { method: "PATCH" }),
    reject: (taskId: string) =>
      request<TaskSubmission>(`/task-submissions/${taskId}/reject`, { method: "PUT" }),
  },

  // comments
  comments: {
    list: (taskId: string) => request<TaskComment[]>(`/tasks/${taskId}/comments`),
    create: (taskId: string, content: string) =>
      request<TaskComment>(`/tasks/${taskId}/comments`, { method: "POST", json: { content } }),
  },

  // rewards
  rewards: {
    list: () => request<Reward[]>("/rewards"),
    create: (data: { name: string; icon: string; need_reward: number }) =>
      request<Reward>("/rewards", { method: "POST", json: data }),
    update: (id: string, data: Partial<{ name: string; icon: string; need_reward: number }>) =>
      request<Reward>(`/rewards/${id}`, { method: "PUT", json: data }),
    remove: (id: string) => request<{ message: string }>(`/rewards/${id}`, { method: "DELETE" }),
  },

  // reward requests
  rewardRequests: {
    list: (params: Record<string, string> = {}) =>
      request<{ requests: RewardRequestWithMeta[] }>(
        `/reward-requests?${new URLSearchParams(params)}`,
      ),
    create: (rewardId: string) =>
      request<RewardRequest>("/reward-requests", { method: "POST", json: { reward_id: rewardId } }),
    approve: (id: string) =>
      request<RewardRequest>(`/reward-requests/${id}/approve`, { method: "POST" }),
    reject: (id: string) =>
      request<RewardRequest>(`/reward-requests/${id}/reject`, { method: "POST" }),
  },

  // reward balance
  rewardBalance: {
    mine: () => request<{ balance: number }>("/reward-balance"),
    all: () =>
      request<{ balances: { user_id: string; name: string; balance: number }[] }>(
        "/reward-balances",
      ),
    histories: (params: Record<string, string> = {}) =>
      request<{ histories: RewardBalanceHistoryWithName[] }>(
        `/reward-balance-histories?${new URLSearchParams(params)}`,
      ),
  },

  // badges
  badges: {
    list: () => request<Badge[]>("/badges"),
    create: (data: { name: string; icon: string; condition: string }) =>
      request<Badge>("/badges", { method: "POST", json: data }),
    update: (
      id: string,
      data: Partial<{ name: string; icon: string; condition: string; is_active: boolean }>,
    ) => request<Badge>(`/badges/${id}`, { method: "PATCH", json: data }),
    remove: (id: string) => request<{ message: string }>(`/badges/${id}`, { method: "DELETE" }),
  },

  // badge assignments
  badgeAssignments: {
    list: () => request<BadgeAssignmentWithBadge[]>("/badge-assignments"),
    history: () =>
      request<BadgeAssignmentWithBadge[]>("/badge-assignments?all=1"),
    receive: (id: string) =>
      request<BadgeAssignment>(`/badge-assignments/${id}/receive`, { method: "POST" }),
  },

  // reports
  reports: {
    progress: (params: Record<string, string> = {}) =>
      request<ProgressReport>(`/reports/progress?${new URLSearchParams(params)}`),
  },
};
