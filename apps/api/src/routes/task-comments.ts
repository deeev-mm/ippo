import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { taskComments } from "../db/schema";
import type { AppVariables } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { newId, nowIso, type Env } from "../lib/crypto";

type App = { Bindings: Env; Variables: AppVariables };

export const taskCommentRoutes = new Hono<App>();

taskCommentRoutes.use("*", requireAuth);

taskCommentRoutes.get("/:taskId/comments", async (c) => {
  const db = c.get("db");
  const comments = await db
    .select({
      id: taskComments.id,
      content: taskComments.content,
      createdAt: taskComments.createdAt,
      userId: taskComments.userId,
    })
    .from(taskComments)
    .where(eq(taskComments.taskId, c.req.param("taskId")))
    .orderBy(asc(taskComments.createdAt));
  return c.json(comments);
});

taskCommentRoutes.post("/:taskId/comments", async (c) => {
  const body = await c.req.json<{ content?: string }>();
  const content = (body.content ?? "").trim();
  if (!content) return c.json({ message: "contentは必須です" }, 422);
  if (content.length > 1000) return c.json({ message: "contentは1000文字以内です" }, 422);

  const db = c.get("db");
  const user = c.get("user");
  const ts = nowIso();
  const id = newId();
  await db.insert(taskComments).values({
    id,
    taskId: c.req.param("taskId"),
    userId: user.id,
    content,
    createdAt: ts,
    updatedAt: ts,
  });

  const comment = await db.select().from(taskComments).where(eq(taskComments.id, id)).get();
  return c.json(comment, 201);
});
