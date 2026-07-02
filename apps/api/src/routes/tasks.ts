import { Hono } from "hono";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { RecurrenceType } from "@ippo/shared";
import { taskComments, taskRecurrences, taskSubmissions, tasks } from "../db/schema";
import type { AppVariables } from "../lib/auth";
import { requireAuth, requireParent } from "../lib/auth";
import { newId, nowIso, todayYmd, type Env } from "../lib/crypto";

type App = { Bindings: Env; Variables: AppVariables };

const RECURRENCE_TYPES: RecurrenceType[] = ["daily", "weekly", "monthly", "weekdays", "weekends"];

export const taskRoutes = new Hono<App>();

taskRoutes.use("*", requireAuth);

async function scopedTasks(c: any) {
  const db = c.get("db");
  const user = c.get("user");
  if (user.role === "child") {
    return db.select().from(tasks).where(eq(tasks.childId, user.id));
  }
  if (user.role !== "parent") return null;
  return db.select().from(tasks);
}

async function enrichTasks(db: any, taskRows: (typeof tasks.$inferSelect)[]) {
  const ids = taskRows.map((t) => t.id);
  if (!ids.length) return [];

  const [submissions, recurrences, comments] = await Promise.all([
    db.select().from(taskSubmissions).where(inArray(taskSubmissions.taskId, ids)),
    db.select().from(taskRecurrences).where(inArray(taskRecurrences.taskId, ids)),
    db.select({ taskId: taskComments.taskId }).from(taskComments).where(inArray(taskComments.taskId, ids)),
  ]);

  const latestSubmissionByTask = new Map<string, typeof taskSubmissions.$inferSelect>();
  for (const s of submissions) {
    const current = latestSubmissionByTask.get(s.taskId);
    if (!current || s.submittedAt > current.submittedAt) latestSubmissionByTask.set(s.taskId, s);
  }

  const recurrencesByTask = new Map<string, (typeof taskRecurrences.$inferSelect)[]>();
  for (const r of recurrences) {
    const list = recurrencesByTask.get(r.taskId) ?? [];
    list.push(r);
    recurrencesByTask.set(r.taskId, list);
  }

  const commentCountByTask = new Map<string, number>();
  for (const cm of comments) {
    commentCountByTask.set(cm.taskId, (commentCountByTask.get(cm.taskId) ?? 0) + 1);
  }

  return taskRows.map((task) => {
    const rec = recurrencesByTask.get(task.id) ?? [];
    const latestSubmission = latestSubmissionByTask.get(task.id) ?? null;
    const recurringDays = rec.map((r) =>
      task.recurrence === "monthly" ? String(r.dayOfMonth) : String(r.dayOfWeek),
    );
    return {
      ...task,
      isRecurring: !!task.recurrence,
      recurringType: task.recurrence,
      recurringDays,
      commentsCount: commentCountByTask.get(task.id) ?? 0,
      completionStatus: latestSubmission?.status ?? null,
      latestSubmission,
    };
  });
}

taskRoutes.get("/today", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const today = todayYmd();
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.childId, user.id), eq(tasks.dueDate, today)));
  return c.json(await enrichTasks(db, rows));
});

taskRoutes.get("/weekday", async (c) => {
  const db = c.get("db");
  const user = c.get("user");

  const now = new Date();
  const day = now.getUTCDay();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - day);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  const rows = await db.select().from(tasks).where(eq(tasks.childId, user.id));
  const ids = rows.map((t: typeof tasks.$inferSelect) => t.id);
  if (!ids.length) return c.json({ task_completed: 0, points_earned: 0 });

  const submissions = await db
    .select()
    .from(taskSubmissions)
    .where(and(inArray(taskSubmissions.taskId, ids), eq(taskSubmissions.status, "approved")));

  const byTask = new Map(rows.map((t: typeof tasks.$inferSelect) => [t.id, t]));
  let taskCompleted = 0;
  let pointsEarned = 0;
  for (const s of submissions) {
    const t = byTask.get(s.taskId);
    if (!t) continue;
    const updated = new Date(t.updatedAt);
    if (updated >= start && updated < end) {
      taskCompleted += 1;
      pointsEarned += t.rewardAmount;
    }
  }
  return c.json({ task_completed: taskCompleted, points_earned: pointsEarned });
});

taskRoutes.get("/", async (c) => {
  const db = c.get("db");
  const query = await scopedTasks(c);
  if (query === null) return c.json({ message: "不正なユーザー" }, 403);

  let rows: (typeof tasks.$inferSelect)[] = await query;
  let enriched = await enrichTasks(db, rows);

  if (c.req.query("exclude_past_approved") === "1") {
    const today = todayYmd();
    enriched = enriched.filter((t) => {
      if (!t.latestSubmission) return true;
      if (t.latestSubmission.status !== "approved") return true;
      return t.latestSubmission.submittedAt.slice(0, 10) >= today;
    });
  }

  const status = c.req.query("status");
  if (status) {
    enriched = enriched.filter((t) =>
      status === "active" ? !t.latestSubmission : t.latestSubmission?.status === status,
    );
  }

  enriched.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const perPage = 5;
  const page = Number(c.req.query("page") ?? "1") || 1;
  const total = enriched.length;
  const start = (page - 1) * perPage;
  const data = enriched.slice(start, start + perPage);

  return c.json({
    data,
    page,
    perPage,
    total,
    lastPage: Math.max(1, Math.ceil(total / perPage)),
  });
});

taskRoutes.get("/:id", async (c) => {
  const db = c.get("db");
  const task = await db.select().from(tasks).where(eq(tasks.id, c.req.param("id"))).get();
  if (!task) return c.json({ message: "見つかりません" }, 404);
  const [enriched] = await enrichTasks(db, [task]);
  return c.json(enriched);
});

taskRoutes.post("/", requireParent, async (c) => {
  const body = await c.req.json<{
    title?: string;
    description?: string | null;
    due_date?: string | null;
    recurrence?: RecurrenceType | null;
    reward_amount?: number | null;
    child_id?: string | null;
    task_category_id?: string | null;
    weekdays?: number[] | null;
  }>();

  if (!body.title?.trim()) return c.json({ message: "titleは必須です" }, 422);
  if (body.recurrence && !RECURRENCE_TYPES.includes(body.recurrence)) {
    return c.json({ message: "recurrenceの値が不正です" }, 422);
  }

  const db = c.get("db");
  const user = c.get("user");
  const ts = nowIso();
  const id = newId();

  await db.insert(tasks).values({
    id,
    title: body.title.trim(),
    description: body.description ?? null,
    dueDate: body.due_date ?? null,
    recurrence: body.recurrence ?? null,
    parentId: user.id,
    childId: body.child_id ?? null,
    taskCategoryId: body.task_category_id ?? null,
    rewardAmount: body.reward_amount ?? 0,
    createdAt: ts,
    updatedAt: ts,
  });

  if (body.recurrence && Array.isArray(body.weekdays)) {
    await insertRecurrences(db, id, body.recurrence, body.weekdays);
  }

  const task = (await db.select().from(tasks).where(eq(tasks.id, id)).get())!;
  const [enriched] = await enrichTasks(db, [task]);
  return c.json(enriched, 201);
});

taskRoutes.put("/:id", requireParent, async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const existing = await db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!existing) return c.json({ message: "更新できません" }, 403);

  const body = await c.req.json<{
    title?: string;
    description?: string | null;
    due_date?: string | null;
    recurrence?: RecurrenceType | null;
    reward_amount?: number | null;
    child_id?: string | null;
    task_category_id?: string | null;
    weekdays?: number[] | null;
  }>();

  if (!body.title?.trim()) return c.json({ message: "titleは必須です" }, 422);
  if (body.recurrence && !RECURRENCE_TYPES.includes(body.recurrence)) {
    return c.json({ message: "recurrenceの値が不正です" }, 422);
  }

  await db
    .update(tasks)
    .set({
      title: body.title.trim(),
      description: body.description ?? null,
      dueDate: body.due_date ?? null,
      recurrence: body.recurrence ?? null,
      childId: body.child_id ?? null,
      taskCategoryId: body.task_category_id ?? null,
      rewardAmount: body.reward_amount ?? 0,
      updatedAt: nowIso(),
    })
    .where(eq(tasks.id, id));

  await db.delete(taskRecurrences).where(eq(taskRecurrences.taskId, id));
  if (body.recurrence && Array.isArray(body.weekdays)) {
    await insertRecurrences(db, id, body.recurrence, body.weekdays);
  }

  const task = (await db.select().from(tasks).where(eq(tasks.id, id)).get())!;
  const [enriched] = await enrichTasks(db, [task]);
  return c.json(enriched);
});

taskRoutes.post("/:id/submit", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const taskId = c.req.param("id");

  const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  if (!task || user.role !== "child" || task.childId !== user.id) {
    return c.json({ message: "許可されていません" }, 403);
  }

  const pending = await db
    .select({ id: taskSubmissions.id })
    .from(taskSubmissions)
    .where(
      and(
        eq(taskSubmissions.taskId, taskId),
        eq(taskSubmissions.userId, user.id),
        eq(taskSubmissions.status, "submitted"),
      ),
    )
    .get();
  if (pending) return c.json({ message: "すでにかくにん中です" }, 422);

  const ts = nowIso();
  const id = newId();
  await db.insert(taskSubmissions).values({
    id,
    taskId,
    userId: user.id,
    status: "submitted",
    submittedAt: ts,
    createdAt: ts,
    updatedAt: ts,
  });

  const submission = await db.select().from(taskSubmissions).where(eq(taskSubmissions.id, id)).get();
  return c.json(submission, 201);
});

taskRoutes.delete("/:id", requireParent, async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const existing = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, id)).get();
  if (!existing) return c.json({ message: "削除できません" }, 403);
  await db.delete(tasks).where(eq(tasks.id, id));
  return c.json({ message: "削除しました" });
});

async function insertRecurrences(
  db: any,
  taskId: string,
  recurrence: RecurrenceType,
  weekdays: number[],
) {
  const ts = nowIso();
  for (const value of weekdays) {
    await db.insert(taskRecurrences).values({
      id: newId(),
      taskId,
      recurrenceType: recurrence,
      dayOfWeek: ["weekly", "weekdays", "weekends"].includes(recurrence) ? value : null,
      dayOfMonth: recurrence === "monthly" ? value : null,
      createdAt: ts,
      updatedAt: ts,
    });
  }
}

export async function calendarTasksHandler(c: any) {
  const db = c.get("db");
  const user = c.get("user");
  const query = await scopedTasks(c);
  if (query === null) return c.json({ message: "不正なユーザー" }, 403);

  let rows: (typeof tasks.$inferSelect)[] = await query;
  let enriched = await enrichTasks(db, rows);

  const status = c.req.query("status");
  if (status) {
    enriched = enriched.filter((t) => t.latestSubmission?.status === status);
  }

  enriched.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return c.json(enriched);
}
