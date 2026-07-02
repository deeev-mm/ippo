import { Hono } from "hono";
import type { Context } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import type { SessionUser } from "@ippo/shared";
import { sessions, users } from "../db/schema";
import type { AppVariables } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { newId, nowIso, sha256Hex, verifyPassword, type Env } from "../lib/crypto";
import { isLocked, normalizeIdentifier, recordFailure, resetAttempts } from "../lib/rate-limit";

const SESSION_DAYS = 30;

type App = { Bindings: Env; Variables: AppVariables };

export const authRoutes = new Hono<App>();

authRoutes.post("/login", async (c) => {
  const body = await c.req.json<{ name?: string; password?: string }>();
  const name = (body.name ?? "").trim();
  const password = body.password ?? "";
  if (!name || !password) {
    return c.json({ error: "名前とパスワードを入力してください" }, 400);
  }

  const db = c.get("db");
  const identifier = normalizeIdentifier(name);

  if (await isLocked(db, "user", identifier)) {
    return c.json(
      { error: "ログイン試行回数が上限に達しました。15分ほど待ってから再試行してください" },
      429,
    );
  }

  const user = await db.select().from(users).where(eq(users.name, name)).get();

  if (!user) {
    await recordFailure(db, "user", identifier);
    return c.json({ error: "名前またはパスワードが違います" }, 401);
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await recordFailure(db, "user", identifier);
    return c.json({ error: "名前またはパスワードが違います" }, 401);
  }
  await resetAttempts(db, "user", identifier);

  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    theme: user.theme,
    role: user.role as SessionUser["role"],
  };
  await issueSession(c, sessionUser);
  return c.json({ user: sessionUser });
});

authRoutes.post("/logout", requireAuth, async (c) => {
  const cookieName = c.env.SESSION_COOKIE_NAME || "ippo_session";
  const token = getCookie(c, cookieName);
  if (token) {
    const db = c.get("db");
    const tokenHash = await sha256Hex(token);
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }
  deleteCookie(c, cookieName, { path: "/" });
  return c.json({ ok: true });
});

authRoutes.get("/me", requireAuth, async (c) => {
  return c.json({ user: c.get("user") });
});

async function issueSession(c: Context<App>, user: SessionUser) {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = [...tokenBytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  const tokenHash = await sha256Hex(token);
  const ts = nowIso();
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);

  await c.get("db").insert(sessions).values({
    id: newId(),
    userId: user.id,
    tokenHash,
    expiresAt: expires.toISOString(),
    createdAt: ts,
  });

  const cookieName = c.env.SESSION_COOKIE_NAME || "ippo_session";
  const isLocal = (c.env.APP_BASE_URL || "").includes("localhost");
  setCookie(c, cookieName, token, {
    httpOnly: true,
    path: "/",
    sameSite: isLocal ? "Lax" : "None",
    secure: !isLocal,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}
