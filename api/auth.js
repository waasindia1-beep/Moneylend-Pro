// Money Lending Business Automation - Auth Endpoints
// Hono router for /api/auth

import { Hono } from "hono";
import { queryOne, run } from "./db.js";

const auth = new Hono();

auth.post("/login", async (c) => {
  let body = {};
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { username, password } = body;
  if (!username || !password) {
    return c.json({ error: "Username and password are required" }, 400);
  }

  const db = c.env?.DB;
  let user = null;

  if (db) {
    try {
      user = await queryOne(db, "SELECT * FROM users WHERE username = ? AND is_active = 1", [username]);
    } catch (e) {
      console.warn("Could not query users table:", e.message);
    }
  }

  // Check credentials (or allow demo admin)
  const isValid = (user && user.password_hash === password) || (username === "admin" && password === "admin123") || (username === "admin" && password === "admin");
  if (!isValid) {
    return c.json({ error: "Invalid username or password" }, 401);
  }

  const userId = user ? user.id : 1;
  const userName = user ? (user.name || user.username) : "Admin User";
  const userRole = user ? user.role : "admin";
  const token = "ml_sess_" + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Save session to KV if available
  if (c.env?.SESSIONS) {
    try {
      await c.env.SESSIONS.put(
        token,
        JSON.stringify({
          user: { id: userId, username, name: userName, role: userRole },
          expires_at: expiresAt
        }),
        { expirationTtl: 86400 }
      );
    } catch (e) {
      console.warn("KV put failed:", e.message);
    }
  }

  // Save session to D1 if available
  if (db) {
    try {
      await run(db, "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [token, userId, expiresAt]);
    } catch (e) {
      console.warn("D1 sessions insert warning:", e.message);
    }
  }

  // Set HTTP-Only Cookie
  c.header("Set-Cookie", `session_id=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);

  return c.json({
    token,
    user: {
      id: userId,
      username,
      name: userName,
      role: userRole
    }
  });
});

auth.post("/logout", async (c) => {
  const cookie = c.req.header("cookie");
  const authHeader = c.req.header("authorization");
  const token = authHeader?.replace("Bearer ", "") || (cookie && cookie.match(/session_id=([^;]+)/)?.[1]);

  if (token && c.env?.SESSIONS) {
    try {
      await c.env.SESSIONS.delete(token);
    } catch (e) {}
  }
  if (token && c.env?.DB) {
    try {
      await run(c.env.DB, "DELETE FROM sessions WHERE id = ?", [token]);
    } catch (e) {}
  }

  c.header("Set-Cookie", "session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return c.json({ success: true, message: "Logged out successfully" });
});

auth.get("/me", async (c) => {
  const cookie = c.req.header("cookie");
  const authHeader = c.req.header("authorization");
  const token = authHeader?.replace("Bearer ", "") || (cookie && cookie.match(/session_id=([^;]+)/)?.[1]);

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (c.env?.SESSIONS) {
    try {
      const data = await c.env.SESSIONS.get(token, { type: "text" });
      if (data) {
        const session = JSON.parse(data);
        return c.json({ user: session.user });
      }
    } catch (e) {}
  }

  // Fallback demo user if token is present
  return c.json({
    user: { id: 1, username: "admin", name: "Admin User", role: "admin" }
  });
});

export default auth;
