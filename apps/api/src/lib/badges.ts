import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { badgeAssignments, badges, taskCategories, taskSubmissions, tasks } from "../db/schema";
import { newId, nowIso } from "./crypto";

type BadgeCondition = {
  task_approve?: { gte: number; category?: string };
  badge_own_count?: { gte: number };
};

/** 子どもの達成状況をチェックし、条件を満たす未付与バッジをpendingで割り当てる */
export async function checkAndAssignBadges(db: Db, childId: string): Promise<void> {
  const approved = await db
    .select({ taskId: taskSubmissions.taskId })
    .from(taskSubmissions)
    .where(and(eq(taskSubmissions.userId, childId), eq(taskSubmissions.status, "approved")));
  const completedTaskCount = approved.length;

  const owned = await db
    .select({ id: badgeAssignments.id })
    .from(badgeAssignments)
    .where(eq(badgeAssignments.userId, childId));
  const ownedBadgeCount = owned.length;

  const activeBadges = await db.select().from(badges).where(eq(badges.isActive, 1));

  for (const badge of activeBadges) {
    let condition: BadgeCondition;
    try {
      condition = JSON.parse(badge.condition);
    } catch {
      continue;
    }

    let meetsCondition = false;

    if (condition.task_approve?.gte != null && completedTaskCount >= condition.task_approve.gte) {
      if (condition.task_approve.category) {
        const rows = await db
          .select({ taskId: taskSubmissions.taskId })
          .from(taskSubmissions)
          .innerJoin(tasks, eq(tasks.id, taskSubmissions.taskId))
          .innerJoin(taskCategories, eq(taskCategories.id, tasks.taskCategoryId))
          .where(
            and(
              eq(taskSubmissions.userId, childId),
              eq(taskSubmissions.status, "approved"),
              eq(taskCategories.slug, condition.task_approve.category),
            ),
          );
        meetsCondition = rows.length >= condition.task_approve.gte;
      } else {
        meetsCondition = true;
      }
    }

    if (!meetsCondition && condition.badge_own_count?.gte != null) {
      meetsCondition = ownedBadgeCount >= condition.badge_own_count.gte;
    }

    if (!meetsCondition) continue;

    const already = await db
      .select({ id: badgeAssignments.id })
      .from(badgeAssignments)
      .where(and(eq(badgeAssignments.userId, childId), eq(badgeAssignments.badgeId, badge.id)))
      .get();
    if (already) continue;

    const ts = nowIso();
    await db.insert(badgeAssignments).values({
      id: newId(),
      userId: childId,
      badgeId: badge.id,
      status: "pending",
      assignedAt: ts,
      receivedAt: null,
      createdAt: ts,
      updatedAt: ts,
    });
  }
}
