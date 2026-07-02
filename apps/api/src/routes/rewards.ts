import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { rewards } from "../db/schema";
import type { AppVariables } from "../lib/auth";
import { requireAuth, requireParent } from "../lib/auth";
import { newId, nowIso, type Env } from "../lib/crypto";

type App = { Bindings: Env; Variables: AppVariables };

export const rewardRoutes = new Hono<App>();

rewardRoutes.use("*", requireAuth);

rewardRoutes.get("/", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(rewards).orderBy(desc(rewards.createdAt));
  return c.json(rows);
});

rewardRoutes.get("/:id", async (c) => {
  const db = c.get("db");
  const reward = await db.select().from(rewards).where(eq(rewards.id, c.req.param("id"))).get();
  if (!reward) return c.json({ message: "見つかりません" }, 404);
  return c.json(reward);
});

rewardRoutes.post("/", requireParent, async (c) => {
  const body = await c.req.json<{ name?: string; icon?: string; need_reward?: number }>();
  if (!body.name?.trim() || !body.icon?.trim() || body.need_reward == null || body.need_reward < 0) {
    return c.json({ message: "name, icon, need_rewardは必須です" }, 422);
  }

  const db = c.get("db");
  const ts = nowIso();
  const id = newId();
  await db.insert(rewards).values({
    id,
    name: body.name.trim(),
    icon: body.icon,
    needReward: body.need_reward,
    createdAt: ts,
    updatedAt: ts,
  });
  const reward = await db.select().from(rewards).where(eq(rewards.id, id)).get();
  return c.json(reward, 201);
});

rewardRoutes.put("/:id", requireParent, async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const existing = await db.select().from(rewards).where(eq(rewards.id, id)).get();
  if (!existing) return c.json({ message: "見つかりません" }, 404);

  const body = await c.req.json<{ name?: string; icon?: string; need_reward?: number }>();
  const update: Partial<typeof rewards.$inferInsert> = { updatedAt: nowIso() };
  if (body.name !== undefined) update.name = body.name;
  if (body.icon !== undefined) update.icon = body.icon;
  if (body.need_reward !== undefined) update.needReward = body.need_reward;
  await db.update(rewards).set(update).where(eq(rewards.id, id));

  const reward = await db.select().from(rewards).where(eq(rewards.id, id)).get();
  return c.json(reward);
});

rewardRoutes.delete("/:id", requireParent, async (c) => {
  const db = c.get("db");
  await db.delete(rewards).where(eq(rewards.id, c.req.param("id")));
  return c.json({ message: "削除しました" });
});
