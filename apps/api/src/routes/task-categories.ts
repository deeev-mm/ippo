import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { taskCategories } from "../db/schema";
import type { AppVariables } from "../lib/auth";
import { requireAuth, requireParent } from "../lib/auth";
import { newId, nowIso, type Env } from "../lib/crypto";

type App = { Bindings: Env; Variables: AppVariables };

export const taskCategoryRoutes = new Hono<App>();

taskCategoryRoutes.use("*", requireAuth);

taskCategoryRoutes.get("/", async (c) => {
  const db = c.get("db");
  const categories = await db.select().from(taskCategories);
  return c.json(categories);
});

taskCategoryRoutes.get("/:id", async (c) => {
  const db = c.get("db");
  const category = await db
    .select()
    .from(taskCategories)
    .where(eq(taskCategories.id, c.req.param("id")))
    .get();
  if (!category) return c.json({ error: "見つかりません" }, 404);
  return c.json(category);
});

taskCategoryRoutes.post("/", requireParent, async (c) => {
  const body = await c.req.json<{ name?: string; slug?: string }>();
  const name = (body.name ?? "").trim();
  const slug = (body.slug ?? "").trim();
  if (!name || !slug) return c.json({ error: "name, slugは必須です" }, 400);

  const db = c.get("db");
  const ts = nowIso();
  const id = newId();
  await db.insert(taskCategories).values({ id, name, slug, createdAt: ts, updatedAt: ts });
  const category = await db.select().from(taskCategories).where(eq(taskCategories.id, id)).get();
  return c.json(category, 201);
});

taskCategoryRoutes.put("/:id", requireParent, async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const existing = await db.select().from(taskCategories).where(eq(taskCategories.id, id)).get();
  if (!existing) return c.json({ error: "見つかりません" }, 404);

  const body = await c.req.json<{ name?: string; slug?: string }>();
  const update: Partial<typeof taskCategories.$inferInsert> = { updatedAt: nowIso() };
  if (body.name !== undefined) update.name = body.name;
  if (body.slug !== undefined) update.slug = body.slug;
  await db.update(taskCategories).set(update).where(eq(taskCategories.id, id));
  return c.json({ message: "Updated successfully" });
});

taskCategoryRoutes.delete("/:id", requireParent, async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  await db.delete(taskCategories).where(eq(taskCategories.id, id));
  return c.json({ message: "削除しました" });
});
