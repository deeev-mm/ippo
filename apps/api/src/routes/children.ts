import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { MIN_PASSWORD_LENGTH } from "@ippo/shared";
import { users } from "../db/schema";
import type { AppVariables } from "../lib/auth";
import { requireAuth, requireParent } from "../lib/auth";
import { hashPassword, newId, nowIso, type Env } from "../lib/crypto";

type App = { Bindings: Env; Variables: AppVariables };

export const childrenRoutes = new Hono<App>();

childrenRoutes.use("*", requireAuth, requireParent);

childrenRoutes.get("/", async (c) => {
  const db = c.get("db");
  const children = await db
    .select({
      id: users.id,
      name: users.name,
      theme: users.theme,
      avatar: users.avatar,
    })
    .from(users)
    .where(eq(users.role, "child"))
    .orderBy(asc(users.id));
  return c.json(children);
});

childrenRoutes.post("/", async (c) => {
  const body = await c.req.json<{ name?: string; password?: string; icon?: string; colorTheme?: string }>();
  const name = (body.name ?? "").trim();
  const password = body.password ?? "";
  if (!name) return c.json({ error: "名前を入力してください" }, 400);
  if (password.length < MIN_PASSWORD_LENGTH) {
    return c.json({ error: `パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください` }, 400);
  }

  const db = c.get("db");
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.name, name)).get();
  if (existing) return c.json({ error: "この名前は既に使われています" }, 409);

  const ts = nowIso();
  const id = newId();
  await db.insert(users).values({
    id,
    name,
    passwordHash: await hashPassword(password),
    avatar: body.icon ?? null,
    theme: body.colorTheme ?? null,
    role: "child",
    createdAt: ts,
    updatedAt: ts,
  });

  const child = await db
    .select({ id: users.id, name: users.name, theme: users.theme, avatar: users.avatar })
    .from(users)
    .where(eq(users.id, id))
    .get();
  return c.json(child, 201);
});

childrenRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .get();
  if (!existing || existing.role !== "child") {
    return c.json({ error: "見つかりません" }, 404);
  }

  const body = await c.req.json<{
    name?: string;
    password?: string;
    avatar?: string;
    theme?: string;
  }>();

  const update: Partial<typeof users.$inferInsert> = { updatedAt: nowIso() };
  if (body.name !== undefined) update.name = body.name;
  if (body.avatar !== undefined) update.avatar = body.avatar;
  if (body.theme !== undefined) update.theme = body.theme;
  if (body.password !== undefined) {
    if (body.password.length < MIN_PASSWORD_LENGTH) {
      return c.json({ error: `パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください` }, 400);
    }
    update.passwordHash = await hashPassword(body.password);
  }

  await db.update(users).set(update).where(eq(users.id, id));

  const child = await db
    .select({ id: users.id, name: users.name, theme: users.theme, avatar: users.avatar })
    .from(users)
    .where(eq(users.id, id))
    .get();
  return c.json(child);
});

childrenRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = c.get("db");
  const existing = await db.select({ role: users.role }).from(users).where(eq(users.id, id)).get();
  if (!existing || existing.role !== "child") {
    return c.json({ error: "見つかりません" }, 404);
  }
  await db.delete(users).where(eq(users.id, id));
  return c.json({ message: "削除しました" });
});
