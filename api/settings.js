// Money Lending Business Automation - Settings Management
// Hono router for /api/settings

import { Hono } from "hono";
import { query, queryOne, run } from "./db.js";

const settings = new Hono();

// Categorize setting keys
function getSettingCategory(key) {
  if (key.startsWith("business_")) return "business";
  if (key.startsWith("default_") || key.includes("interest") || key.includes("tenure") || key.includes("due_day") || key.includes("grace") || key.includes("late_fee")) return "loans";
  if (key.startsWith("reminder_") || key.startsWith("whatsapp_") || key.startsWith("sms_")) return "reminders";
  if (key.includes("session") || key.includes("auth") || key.includes("password")) return "security";
  return "general";
}

// GET /api/settings - List all settings
settings.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ data: [] });

  const data = await query(db, "SELECT * FROM settings ORDER BY key ASC");
  return c.json({ data: data || [] });
});

// GET /api/settings/grouped - Return settings grouped by category
settings.get("/grouped", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ grouped: {} });

  const data = await query(db, "SELECT * FROM settings ORDER BY key ASC");
  const grouped = {
    business: [],
    loans: [],
    reminders: [],
    general: []
  };

  for (const s of data || []) {
    const cat = getSettingCategory(s.key);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  }

  return c.json({ grouped });
});

// GET /api/settings/:key - Get single setting value
settings.get("/:key", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const key = c.req.param("key");
  const setting = await queryOne(db, "SELECT * FROM settings WHERE key = ?", [key]);
  if (!setting) {
    return c.json({ error: "Setting not found" }, 404);
  }

  return c.json(setting);
});

// POST /api/settings/bulk - Bulk update settings
settings.post("/bulk", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const body = await c.req.json();
  const settingsList = body.settings || [];

  for (const item of settingsList) {
    if (item.key && item.value !== undefined) {
      const existing = await queryOne(db, "SELECT key FROM settings WHERE key = ?", [item.key]);
      if (existing) {
        await run(
          db,
          "UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?",
          [String(item.value), item.key]
        );
      } else {
        await run(
          db,
          "INSERT INTO settings (key, value, description) VALUES (?, ?, ?)",
          [item.key, String(item.value), item.description || null]
        );
      }
    }
  }

  return c.json({ success: true, count: settingsList.length });
});

// POST /api/settings - Create or update a setting (upsert)
settings.post("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const body = await c.req.json();
  const { key, value, description } = body;

  if (!key || value === undefined) {
    return c.json({ error: "Key and value are required" }, 400);
  }

  const existing = await queryOne(db, "SELECT key FROM settings WHERE key = ?", [key]);

  if (existing) {
    await run(
      db,
      "UPDATE settings SET value = ?, description = COALESCE(?, description), updated_at = datetime('now') WHERE key = ?",
      [String(value), description || null, key]
    );
  } else {
    await run(
      db,
      "INSERT INTO settings (key, value, description) VALUES (?, ?, ?)",
      [key, String(value), description || null]
    );
  }

  const setting = await queryOne(db, "SELECT * FROM settings WHERE key = ?", [key]);
  return c.json(setting, 201);
});

// PUT /api/settings/:key - Update a setting
settings.put("/:key", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const key = c.req.param("key");
  const body = await c.req.json();

  const existing = await queryOne(db, "SELECT key FROM settings WHERE key = ?", [key]);
  if (!existing) {
    return c.json({ error: "Setting not found" }, 404);
  }

  const { value, description } = body;

  await run(
    db,
    "UPDATE settings SET value = ?, description = COALESCE(?, description), updated_at = datetime('now') WHERE key = ?",
    [String(value), description || null, key]
  );

  const updated = await queryOne(db, "SELECT * FROM settings WHERE key = ?", [key]);
  return c.json(updated);
});

export default settings;
