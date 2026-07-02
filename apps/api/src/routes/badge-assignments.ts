import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { badgeAssignments, badges } from "../db/schema";
import type { AppVariables } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { nowIso, type Env } from "../lib/crypto";

type App = { Bindings: Env; Variables: AppVariables };

export const badgeAssignmentRoutes = new Hono<App>();

badgeAssignmentRoutes.use("*", requireAuth);

badgeAssignmentRoutes.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const rows = await db
    .select({ assignment: badgeAssignments, badge: badges })
    .from(badgeAssignments)
    .innerJoin(badges, eq(badges.id, badgeAssignments.badgeId))
    .where(eq(badgeAssignments.userId, user.id));
  return c.json(rows.map((r) => ({ ...r.assignment, badge: r.badge })));
});

// pending状態のバッジ付与を、本人（子ども）が受け取り確定する
badgeAssignmentRoutes.post("/:id/receive", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const id = c.req.param("id");

  const assignment = await db
    .select()
    .from(badgeAssignments)
    .where(and(eq(badgeAssignments.id, id), eq(badgeAssignments.userId, user.id)))
    .get();
  if (!assignment) return c.json({ message: "見つかりません" }, 404);
  if (assignment.receivedAt !== null) {
    return c.json({ message: "すでに受け取っています" }, 400);
  }

  const ts = nowIso();
  await db
    .update(badgeAssignments)
    .set({ status: "granted", receivedAt: ts, updatedAt: ts })
    .where(eq(badgeAssignments.id, id));

  const updated = await db.select().from(badgeAssignments).where(eq(badgeAssignments.id, id)).get();
  return c.json(updated);
});
