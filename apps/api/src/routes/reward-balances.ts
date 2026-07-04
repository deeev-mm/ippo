import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { rewardBalanceHistories, rewardBalances, users } from "../db/schema";
import type { AppVariables } from "../lib/auth";
import { requireAuth, requireParent } from "../lib/auth";
import type { Env } from "../lib/crypto";

type App = { Bindings: Env; Variables: AppVariables };

export const rewardBalanceRoutes = new Hono<App>();

rewardBalanceRoutes.use("*", requireAuth);

rewardBalanceRoutes.get("/reward-balance", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const balance = await db.select().from(rewardBalances).where(eq(rewardBalances.userId, user.id)).get();
  return c.json({ balance: balance?.balance ?? 0 });
});

rewardBalanceRoutes.get("/reward-balances", requireParent, async (c) => {
  const db = c.get("db");
  const children = await db.select().from(users).where(eq(users.role, "child"));
  const balances = await db.select().from(rewardBalances);
  const balanceByUser = new Map(balances.map((b) => [b.userId, b.balance]));

  return c.json({
    balances: children.map((child) => ({
      user_id: child.id,
      name: child.name,
      balance: balanceByUser.get(child.id) ?? 0,
    })),
  });
});

rewardBalanceRoutes.get("/reward-balance-histories", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const childId = c.req.query("childId");

  let rows;
  if (user.role === "child") {
    rows = await db
      .select({ history: rewardBalanceHistories, name: users.name })
      .from(rewardBalanceHistories)
      .innerJoin(users, eq(users.id, rewardBalanceHistories.userId))
      .where(eq(rewardBalanceHistories.userId, user.id))
      .orderBy(desc(rewardBalanceHistories.changedAt));
  } else if (childId) {
    rows = await db
      .select({ history: rewardBalanceHistories, name: users.name })
      .from(rewardBalanceHistories)
      .innerJoin(users, eq(users.id, rewardBalanceHistories.userId))
      .where(eq(rewardBalanceHistories.userId, childId))
      .orderBy(desc(rewardBalanceHistories.changedAt));
  } else {
    rows = await db
      .select({ history: rewardBalanceHistories, name: users.name })
      .from(rewardBalanceHistories)
      .innerJoin(users, eq(users.id, rewardBalanceHistories.userId))
      .orderBy(desc(rewardBalanceHistories.changedAt));
  }

  return c.json({
    histories: rows.map((r) => ({ ...r.history, userName: r.name })),
  });
});
