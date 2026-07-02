import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { rewardBalances, users } from "../db/schema";
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
