import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { rewardBalanceHistories, rewardBalances, rewardRequestHistories, rewardRequests, rewards, users } from "../db/schema";
import type { AppVariables } from "../lib/auth";
import { requireAuth, requireParent } from "../lib/auth";
import { newId, nowIso, type Env } from "../lib/crypto";

type App = { Bindings: Env; Variables: AppVariables };

export const rewardRequestRoutes = new Hono<App>();

rewardRequestRoutes.use("*", requireAuth);

rewardRequestRoutes.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const status = c.req.query("status");

  const conditions = [];
  if (user.role === "child") conditions.push(eq(rewardRequests.userId, user.id));
  if (status) conditions.push(eq(rewardRequests.status, status));

  const rows = await db
    .select({
      request: rewardRequests,
      reward: rewards,
      user: { id: users.id, name: users.name },
    })
    .from(rewardRequests)
    .innerJoin(rewards, eq(rewards.id, rewardRequests.rewardId))
    .innerJoin(users, eq(users.id, rewardRequests.userId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(rewardRequests.requestedAt));

  return c.json({
    requests: rows.map((r) => ({ ...r.request, reward: r.reward, user: r.user })),
  });
});

rewardRequestRoutes.post("/", async (c) => {
  const body = await c.req.json<{ reward_id?: string }>();
  if (!body.reward_id) return c.json({ message: "reward_idは必須です" }, 422);

  const db = c.get("db");
  const user = c.get("user");

  const reward = await db.select().from(rewards).where(eq(rewards.id, body.reward_id)).get();
  if (!reward) return c.json({ message: "見つかりません" }, 422);

  const balance = await db.select().from(rewardBalances).where(eq(rewardBalances.userId, user.id)).get();
  if (!balance || balance.balance < reward.needReward) {
    return c.json({ message: "ポイントが不足しています" }, 422);
  }

  const ts = nowIso();
  const id = newId();
  await db.insert(rewardRequests).values({
    id,
    userId: user.id,
    rewardId: reward.id,
    status: "submitted",
    requestedAt: ts,
    createdAt: ts,
    updatedAt: ts,
  });
  await db.insert(rewardRequestHistories).values({
    id: newId(),
    rewardRequestId: id,
    status: "submitted",
    changedBy: user.id,
    changedAt: ts,
  });

  const request = await db.select().from(rewardRequests).where(eq(rewardRequests.id, id)).get();
  return c.json(request, 201);
});

rewardRequestRoutes.post("/:id/approve", requireParent, async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const user = c.get("user");

  const request = await db.select().from(rewardRequests).where(eq(rewardRequests.id, id)).get();
  if (!request) return c.json({ message: "見つかりません" }, 404);
  if (request.status !== "submitted") return c.json({ message: "既に処理済みです" }, 422);

  const reward = await db.select().from(rewards).where(eq(rewards.id, request.rewardId)).get();
  const balance = await db.select().from(rewardBalances).where(eq(rewardBalances.userId, request.userId)).get();
  if (!reward || !balance || balance.balance < reward.needReward) {
    return c.json({ message: "ポイント不足で承認できません" }, 422);
  }

  const ts = nowIso();
  await db
    .update(rewardBalances)
    .set({ balance: balance.balance - reward.needReward, updatedAt: ts })
    .where(eq(rewardBalances.userId, request.userId));
  await db.insert(rewardBalanceHistories).values({
    id: newId(),
    userId: request.userId,
    changeType: "subtract",
    amount: -reward.needReward,
    relatedId: request.id,
    changedAt: ts,
  });

  await db.update(rewardRequests).set({ status: "approved", updatedAt: ts }).where(eq(rewardRequests.id, id));
  await db.insert(rewardRequestHistories).values({
    id: newId(),
    rewardRequestId: id,
    status: "approved",
    changedBy: user.id,
    changedAt: ts,
  });

  const updated = await db.select().from(rewardRequests).where(eq(rewardRequests.id, id)).get();
  return c.json(updated);
});

rewardRequestRoutes.post("/:id/reject", requireParent, async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const user = c.get("user");

  const request = await db.select().from(rewardRequests).where(eq(rewardRequests.id, id)).get();
  if (!request) return c.json({ message: "見つかりません" }, 404);
  if (request.status !== "submitted") return c.json({ message: "既に処理済みです" }, 422);

  const ts = nowIso();
  await db.update(rewardRequests).set({ status: "rejected", updatedAt: ts }).where(eq(rewardRequests.id, id));
  await db.insert(rewardRequestHistories).values({
    id: newId(),
    rewardRequestId: id,
    status: "rejected",
    changedBy: user.id,
    changedAt: ts,
  });

  const updated = await db.select().from(rewardRequests).where(eq(rewardRequests.id, id)).get();
  return c.json(updated);
});
