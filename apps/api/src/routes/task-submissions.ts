import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import type { RecurrenceType } from "@ippo/shared";
import { rewardBalanceHistories, rewardBalances, taskRecurrences, taskSubmissions, tasks } from "../db/schema";
import type { AppVariables } from "../lib/auth";
import { requireAuth, requireParent } from "../lib/auth";
import { newId, nowIso, type Env } from "../lib/crypto";
import { calculateNextDueDate } from "../lib/recurrence";
import { checkAndAssignBadges } from "../lib/badges";

type App = { Bindings: Env; Variables: AppVariables };

export const taskSubmissionRoutes = new Hono<App>();

taskSubmissionRoutes.use("*", requireAuth, requireParent);

async function latestSubmitted(db: any, taskId: string) {
  return db
    .select()
    .from(taskSubmissions)
    .where(and(eq(taskSubmissions.taskId, taskId), eq(taskSubmissions.status, "submitted")))
    .orderBy(desc(taskSubmissions.submittedAt))
    .get();
}

taskSubmissionRoutes.patch("/:taskId/approve", async (c) => {
  const db = c.get("db");
  const taskId = c.req.param("taskId");

  const submission = await latestSubmitted(db, taskId);
  if (!submission) return c.json({ message: "申請が見つかりません" }, 404);

  const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  if (!task) return c.json({ message: "申請が見つかりません" }, 404);

  if (task.recurrence && task.dueDate) {
    const recurrences = await db
      .select()
      .from(taskRecurrences)
      .where(eq(taskRecurrences.taskId, taskId));
    const nextDate = calculateNextDueDate(task.dueDate, task.recurrence as RecurrenceType, recurrences);

    if (nextDate) {
      const ts = nowIso();
      const newTaskId = newId();
      await db.insert(tasks).values({
        id: newTaskId,
        title: task.title,
        description: task.description,
        childId: task.childId,
        rewardAmount: task.rewardAmount,
        taskCategoryId: task.taskCategoryId,
        parentId: task.parentId,
        dueDate: nextDate,
        recurrence: task.recurrence,
        createdAt: ts,
        updatedAt: ts,
      });
      for (const r of recurrences) {
        await db.insert(taskRecurrences).values({
          id: newId(),
          taskId: newTaskId,
          recurrenceType: r.recurrenceType,
          dayOfWeek: r.dayOfWeek,
          dayOfMonth: r.dayOfMonth,
          createdAt: ts,
          updatedAt: ts,
        });
      }
    }
  }

  const ts = nowIso();
  await db
    .update(taskSubmissions)
    .set({ status: "approved", updatedAt: ts })
    .where(eq(taskSubmissions.id, submission.id));

  if (task.childId) {
    const rewardAmount = task.rewardAmount ?? 0;
    const balance = await db
      .select()
      .from(rewardBalances)
      .where(eq(rewardBalances.userId, task.childId))
      .get();

    if (balance) {
      await db
        .update(rewardBalances)
        .set({ balance: balance.balance + rewardAmount, updatedAt: ts })
        .where(eq(rewardBalances.userId, task.childId));
    } else {
      await db.insert(rewardBalances).values({ userId: task.childId, balance: rewardAmount, updatedAt: ts });
    }

    await db.insert(rewardBalanceHistories).values({
      id: newId(),
      userId: task.childId,
      changeType: "add",
      amount: rewardAmount,
      relatedId: submission.id,
      changedAt: ts,
    });

    await checkAndAssignBadges(db, task.childId);
  }

  const updated = await db.select().from(taskSubmissions).where(eq(taskSubmissions.id, submission.id)).get();
  return c.json(updated);
});

taskSubmissionRoutes.put("/:taskId/reject", async (c) => {
  const db = c.get("db");
  const taskId = c.req.param("taskId");

  const submission = await latestSubmitted(db, taskId);
  if (!submission) return c.json({ message: "申請が見つかりません" }, 404);

  await db
    .update(taskSubmissions)
    .set({ status: "rejected", updatedAt: nowIso() })
    .where(eq(taskSubmissions.id, submission.id));

  const updated = await db.select().from(taskSubmissions).where(eq(taskSubmissions.id, submission.id)).get();
  return c.json(updated);
});
