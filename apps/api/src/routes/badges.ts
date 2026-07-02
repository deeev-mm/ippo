import { Hono, type Context } from "hono";
import { desc, eq } from "drizzle-orm";
import { badges } from "../db/schema";
import type { AppVariables } from "../lib/auth";
import { requireAuth, requireParent } from "../lib/auth";
import { newId, nowIso, type Env } from "../lib/crypto";

type App = { Bindings: Env; Variables: AppVariables };

export const badgeRoutes = new Hono<App>();

badgeRoutes.use("*", requireAuth);

badgeRoutes.get("/", async (c) => {
  const db = c.get("db");
  const rows = await db.select().from(badges).orderBy(desc(badges.createdAt));
  return c.json(rows);
});

badgeRoutes.get("/:id", async (c) => {
  const db = c.get("db");
  const badge = await db.select().from(badges).where(eq(badges.id, c.req.param("id"))).get();
  if (!badge) return c.json({ message: "見つかりません" }, 404);
  return c.json(badge);
});

badgeRoutes.post("/", requireParent, async (c) => {
  const body = await c.req.json<{ name?: string; icon?: string; condition?: string }>();
  if (!body.name?.trim() || !body.icon?.trim() || !body.condition?.trim()) {
    return c.json({ message: "name, icon, conditionは必須です" }, 422);
  }

  const db = c.get("db");
  const ts = nowIso();
  const id = newId();
  await db.insert(badges).values({
    id,
    name: body.name.trim(),
    icon: body.icon,
    condition: body.condition,
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  });
  const badge = await db.select().from(badges).where(eq(badges.id, id)).get();
  return c.json(badge, 201);
});

async function updateBadge(c: Context<App, "/:id">) {
  const id = c.req.param("id");
  const db = c.get("db");
  const existing = await db.select().from(badges).where(eq(badges.id, id)).get();
  if (!existing) return c.json({ message: "見つかりません" }, 404);

  const body = await c.req.json<{
    name?: string;
    icon?: string;
    condition?: string;
    is_active?: boolean;
  }>();
  const update: Partial<typeof badges.$inferInsert> = { updatedAt: nowIso() };
  if (body.name !== undefined) update.name = body.name;
  if (body.icon !== undefined) update.icon = body.icon;
  if (body.condition !== undefined) update.condition = body.condition;
  if (body.is_active !== undefined) update.isActive = body.is_active ? 1 : 0;
  await db.update(badges).set(update).where(eq(badges.id, id));

  const badge = await db.select().from(badges).where(eq(badges.id, id)).get();
  return c.json(badge);
}

badgeRoutes.put("/:id", requireParent, updateBadge);
badgeRoutes.patch("/:id", requireParent, updateBadge);

badgeRoutes.delete("/:id", requireParent, async (c) => {
  const db = c.get("db");
  await db.delete(badges).where(eq(badges.id, c.req.param("id")));
  return c.json({ message: "削除しました" });
});
