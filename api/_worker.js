// Money Lending Business Automation - Cloudflare Worker Entry Point
// Hono router with all API routes and cron scheduled handler

import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";

import auth from "./auth.js";
import customers from "./customers.js";
import loans from "./loans.js";
import payments from "./payments.js";
import reminders, { generateDailyReminders } from "./reminders.js";
import calculations from "./calculations.js";
import reports from "./reports.js";
import settings from "./settings.js";

const app = new Hono();

// Global Middlewares
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Total-Count"],
    maxAge: 86400
  })
);
app.use("*", secureHeaders());

// Health check endpoints
app.get("/health", (c) => c.json({ status: "ok", app: "MoneyLend Pro", timestamp: new Date().toISOString() }));
app.get("/api/health", (c) => c.json({ status: "ok", app: "MoneyLend Pro", timestamp: new Date().toISOString() }));

// Public routes
app.route("/api/auth", auth);
app.route("/api/calculations", calculations);

// Optional authentication middleware for API
app.use("/api/*", async (c, next) => {
  // Allow health and auth routes
  if (
    c.req.path.startsWith("/api/auth") ||
    c.req.path.startsWith("/api/health") ||
    c.req.path.startsWith("/api/calculations")
  ) {
    await next();
    return;
  }

  const cookie = c.req.header("cookie");
  const authHeader = c.req.header("authorization");
  const token = authHeader?.replace("Bearer ", "") || (cookie && cookie.match(/session_id=([^;]+)/)?.[1]);

  // If KV is configured, validate session
  if (token && c.env?.SESSIONS) {
    try {
      const sessionData = await c.env.SESSIONS.get(token, { type: "text" });
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (new Date(session.expires_at) < new Date()) {
          await c.env.SESSIONS.delete(token);
          return c.json({ error: "Session expired" }, 401);
        }
        c.set("user", session.user);
      }
    } catch (e) {
      console.warn("Session validation warning:", e.message);
    }
  }

  await next();
});

// Protected routes
app.route("/api/customers", customers);
app.route("/api/loans", loans);
app.route("/api/payments", payments);
app.route("/api/reminders", reminders);
app.route("/api/reports", reports);
app.route("/api/settings", settings);

// 404 handler for API
app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "Endpoint not found" }, 404);
  }
  // For pages/static assets, fallback to env.ASSETS if present
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text("Not found", 404);
});

// Global error handler
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

export default {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    console.log("Running scheduled daily reminder cron:", event.cron);
    if (ctx?.waitUntil) {
      ctx.waitUntil(generateDailyReminders(env));
    } else {
      await generateDailyReminders(env);
    }
  }
};
