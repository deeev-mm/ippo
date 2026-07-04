import { Hono } from "hono";
import { and, eq, gte, inArray } from "drizzle-orm";
import { taskSubmissions, tasks, users } from "../db/schema";
import type { AppVariables } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { todayYmd, type Env } from "../lib/crypto";

type App = { Bindings: Env; Variables: AppVariables };

export const reportRoutes = new Hono<App>();

reportRoutes.use("*", requireAuth);

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date(`${todayYmd()}T00:00:00Z`);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

reportRoutes.get("/progress", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const days = Math.min(31, Math.max(1, Number(c.req.query("days") ?? "7") || 7));
  const dayList = lastNDays(days);
  const sinceDate = `${dayList[0]}T00:00:00.000Z`;

  const childIdParam = c.req.query("childId");

  let children: { id: string; name: string; avatar: string | null }[];
  if (user.role === "child") {
    children = [{ id: user.id, name: user.name, avatar: user.avatar }];
  } else {
    const rows = await db
      .select({ id: users.id, name: users.name, avatar: users.avatar })
      .from(users)
      .where(eq(users.role, "child"));
    children = childIdParam ? rows.filter((r) => r.id === childIdParam) : rows;
  }

  const childIds = children.map((c) => c.id);
  const completed: Record<string, number[]> = {};
  const points: Record<string, number[]> = {};
  for (const child of children) {
    completed[child.id] = dayList.map(() => 0);
    points[child.id] = dayList.map(() => 0);
  }

  if (childIds.length) {
    const rows = await db
      .select({
        submittedAt: taskSubmissions.submittedAt,
        rewardAmount: tasks.rewardAmount,
        childId: tasks.childId,
      })
      .from(taskSubmissions)
      .innerJoin(tasks, eq(tasks.id, taskSubmissions.taskId))
      .where(
        and(
          eq(taskSubmissions.status, "approved"),
          inArray(tasks.childId, childIds),
          gte(taskSubmissions.submittedAt, sinceDate),
        ),
      );

    for (const row of rows) {
      if (!row.childId) continue;
      const ymd = row.submittedAt.slice(0, 10);
      const idx = dayList.indexOf(ymd);
      if (idx === -1) continue;
      completed[row.childId][idx] += 1;
      points[row.childId][idx] += row.rewardAmount;
    }
  }

  return c.json({ days: dayList, children, completed, points });
});
