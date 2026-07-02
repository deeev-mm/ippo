import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { and, eq, gt } from "drizzle-orm";
import type { SessionUser } from "@ippo/shared";
import { createDb } from "../db/client";
import { sessions, users } from "../db/schema";
import type { Env } from "./crypto";
import { sha256Hex } from "./crypto";

export type AppVariables = {
  user: SessionUser;
  db: ReturnType<typeof createDb>;
};

export const withDb = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(
  async (c, next) => {
    c.set("db", createDb(c.env.DB));
    await next();
  },
);

export const requireAuth = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const cookieName = c.env.SESSION_COOKIE_NAME || "ippo_session";
  const token = getCookie(c, cookieName);
  if (!token) {
    return c.json({ error: "ログインが必要です" }, 401);
  }

  const db = c.get("db");
  const tokenHash = await sha256Hex(token);
  const now = new Date().toISOString();

  const row = await db
    .select({
      userId: users.id,
      name: users.name,
      avatar: users.avatar,
      theme: users.theme,
      role: users.role,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .get();

  if (!row) {
    return c.json({ error: "セッションが無効です" }, 401);
  }

  const user: SessionUser = {
    id: row.userId,
    name: row.name,
    avatar: row.avatar,
    theme: row.theme,
    role: row.role as SessionUser["role"],
  };
  c.set("user", user);
  await next();
});

export const requireParent = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const user = c.get("user");
  if (user.role !== "parent") {
    return c.json({ error: "権限がありません" }, 403);
  }
  await next();
});
