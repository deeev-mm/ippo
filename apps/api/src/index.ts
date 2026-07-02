import { Hono } from "hono";
import type { AppVariables } from "./lib/auth";
import { withDb, requireAuth } from "./lib/auth";
import { corsMiddleware } from "./lib/cors";
import type { Env } from "./lib/crypto";
import { authRoutes } from "./routes/auth";
import { childrenRoutes } from "./routes/children";
import { taskCategoryRoutes } from "./routes/task-categories";
import { taskRoutes, calendarTasksHandler } from "./routes/tasks";
import { taskSubmissionRoutes } from "./routes/task-submissions";
import { taskCommentRoutes } from "./routes/task-comments";
import { rewardRoutes } from "./routes/rewards";
import { rewardRequestRoutes } from "./routes/reward-requests";
import { rewardBalanceRoutes } from "./routes/reward-balances";
import { badgeRoutes } from "./routes/badges";
import { badgeAssignmentRoutes } from "./routes/badge-assignments";

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use("*", corsMiddleware);
app.use("*", withDb);

app.get("/", (c) => c.json({ ok: true, service: "ippo-api" }));

app.route("/auth", authRoutes);
app.route("/children", childrenRoutes);
app.route("/task-categories", taskCategoryRoutes);
app.route("/tasks", taskRoutes);
app.route("/task-submissions", taskSubmissionRoutes);
app.route("/tasks", taskCommentRoutes);
app.route("/rewards", rewardRoutes);
app.route("/reward-requests", rewardRequestRoutes);
app.route("/", rewardBalanceRoutes);
app.route("/badges", badgeRoutes);
app.route("/badge-assignments", badgeAssignmentRoutes);
app.get("/calendar-tasks", requireAuth, calendarTasksHandler);

export default app;
