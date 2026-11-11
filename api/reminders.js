// Money Lending Business Automation - Reminder Generation + WhatsApp Links + Cron Handler
// Hono router for /api/reminders

import { Hono } from "hono";
import { query, queryOne, run } from "./db.js";
import { normalizePhone, generateWhatsAppUrl, getToday, addDays, daysBetween } from "./utils.js";

const reminders = new Hono();

// Helper to get settings map
async function getSettingsMap(db) {
  const map = {
    business_name: "Sharma Lending",
    business_phone: "9876543210",
    reminder_days_before_due: "3",
    auto_default_days: "90",
    reminder_template_due_soon:
      "Hi {{customer_name}}, reminder: Your EMI of INR {{emi}} for loan #{{loan_id}} is due on {{due_date}}. Please pay to avoid late fees. - {{business_name}}",
    reminder_template_due_today:
      "Hi {{customer_name}}, your EMI of INR {{emi}} for loan #{{loan_id}} is DUE TODAY. Please pay immediately. - {{business_name}}",
    reminder_template_overdue:
      "Hi {{customer_name}}, your payment of INR {{amount}} for loan #{{loan_id}} is {{days_overdue}} days overdue. Please pay immediately to avoid further charges. - {{business_name}}",
    reminder_template_payment_confirmed:
      "Hi {{customer_name}}, we received INR {{amount}} for loan #{{loan_id}} on {{date}}. Thank you! - {{business_name}}"
  };

  if (!db) return map;
  try {
    const rows = await query(db, "SELECT key, value FROM settings");
    for (const r of rows) {
      if (r.value !== undefined && r.value !== null) {
        map[r.key] = r.value;
      }
    }
  } catch (e) {
    console.warn("Could not load settings in reminders:", e.message);
  }
  return map;
}

// Render template with placeholders
function renderTemplate(template, replacements) {
  let rendered = template || "";
  for (const [key, value] of Object.entries(replacements)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, "g"), value !== undefined && value !== null ? String(value) : "");
  }
  return rendered;
}

// Generate reminder message for a loan
function generateReminderMessage(loan, customer, reminderType, settingsMap) {
  const businessName = settingsMap.business_name || "Lending Business";
  const emi = loan.emi || 0;
  const loanId = loan.id;
  const customerName = customer?.name || loan?.customer_name || "";
  const dueDate = loan.next_due_date || "";
  const overdueAmount = loan.outstanding_balance || 0;
  const daysOverdue = loan.next_due_date ? Math.max(daysBetween(loan.next_due_date, getToday()), 0) : 0;

  const replacements = {
    customer_name: customerName,
    loan_id: loanId,
    emi,
    due_date: dueDate,
    amount: overdueAmount,
    days_overdue: daysOverdue,
    business_name: businessName,
    business_phone: settingsMap.business_phone || "",
    date: getToday()
  };

  let templateKey = "reminder_template_due_soon";
  if (reminderType === "due_today") templateKey = "reminder_template_due_today";
  else if (reminderType === "overdue") templateKey = "reminder_template_overdue";
  else if (reminderType === "payment_confirmed") templateKey = "reminder_template_payment_confirmed";

  const template = settingsMap[templateKey] || `Hi ${customerName}, reminder for loan #${loanId}. Please pay ₹${emi}. - ${businessName}`;
  return renderTemplate(template, replacements);
}

// GET /api/reminders/due - Loans due in N days, due today, and overdue
reminders.get("/due", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ due_soon: [], due_today: [], overdue: [] });

  const daysBefore = parseInt(c.req.query("days") || "3");
  const today = getToday();
  const dueSoonDate = addDays(today, daysBefore);

  const dueSoon = await query(
    db,
    `SELECT l.*, c.name as customer_name, c.phone as customer_phone
     FROM loans l
     INNER JOIN customers c ON l.customer_id = c.id
     WHERE l.status = 'active' AND l.next_due_date > ? AND l.next_due_date <= ?
     ORDER BY l.next_due_date ASC`,
    [today, dueSoonDate]
  );

  const dueToday = await query(
    db,
    `SELECT l.*, c.name as customer_name, c.phone as customer_phone
     FROM loans l
     INNER JOIN customers c ON l.customer_id = c.id
     WHERE l.status = 'active' AND l.next_due_date = ?`,
    [today]
  );

  const overdue = await query(
    db,
    `SELECT l.*, c.name as customer_name, c.phone as customer_phone
     FROM loans l
     INNER JOIN customers c ON l.customer_id = c.id
     WHERE l.status = 'active' AND l.next_due_date < ?
     ORDER BY l.next_due_date ASC`,
    [today]
  );

  return c.json({
    date: today,
    due_soon: dueSoon || [],
    due_today: dueToday || [],
    overdue: overdue || []
  });
});

// POST /api/reminders/generate-links - Generate wa.me links for selected loan IDs
reminders.post("/generate-links", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const body = await c.req.json();
  const { loan_ids, reminder_type } = body;

  if (!loan_ids || !Array.isArray(loan_ids)) {
    return c.json({ error: "loan_ids array is required" }, 400);
  }

  const settingsMap = await getSettingsMap(db);
  const type = reminder_type || "due_soon";
  const results = [];

  for (const id of loan_ids) {
    const loan = await queryOne(
      db,
      `SELECT l.*, c.name as customer_name, c.phone as customer_phone
       FROM loans l
       INNER JOIN customers c ON l.customer_id = c.id
       WHERE l.id = ?`,
      [id]
    );

    if (loan) {
      const message = generateReminderMessage(loan, loan, type, settingsMap);
      const url = generateWhatsAppUrl(loan.customer_phone, message);
      await run(
        db,
        `INSERT INTO reminders_log (loan_id, customer_id, reminder_type, sent_via, status, message, whatsapp_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [loan.id, loan.customer_id, type, "whatsapp_link", "generated", message, url]
      );
      results.push({ loan_id: loan.id, customer_name: loan.customer_name, phone: loan.customer_phone, whatsapp_url: url, message });
    }
  }

  return c.json({ count: results.length, reminders: results });
});

// POST /api/reminders - Generate single reminder
reminders.post("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const body = await c.req.json();
  const { loan_id, reminder_type, customer_phone_override } = body;

  if (!loan_id || !reminder_type) {
    return c.json({ error: "Loan ID and reminder type are required" }, 400);
  }

  const loan = await queryOne(
    db,
    `SELECT l.*, c.name as customer_name, c.phone as customer_phone
     FROM loans l
     INNER JOIN customers c ON l.customer_id = c.id
     WHERE l.id = ?`,
    [loan_id]
  );
  if (!loan) {
    return c.json({ error: "Loan not found" }, 404);
  }

  const settingsMap = await getSettingsMap(db);
  const message = generateReminderMessage(loan, loan, reminder_type, settingsMap);
  const phone = customer_phone_override || loan.customer_phone;
  const whatsappUrl = generateWhatsAppUrl(phone, message);

  const result = await run(
    db,
    `INSERT INTO reminders_log (loan_id, customer_id, reminder_type, sent_via, status, message, whatsapp_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [loan.id, loan.customer_id, reminder_type, "whatsapp_link", "generated", message, whatsappUrl]
  );

  const newId = result?.meta?.last_row_id;
  const reminder = await queryOne(db, "SELECT * FROM reminders_log WHERE id = ?", [newId]);

  return c.json(
    {
      reminder,
      whatsapp_url: whatsappUrl,
      message
    },
    201
  );
});

// GET /api/reminders / GET /api/reminders/log - List reminders with filters
async function handleListReminders(c) {
  const db = c.env.DB;
  if (!db) return c.json({ data: [], pagination: { page: 1, limit: 25, total: 0, total_pages: 0 } });

  const search = c.req.query("search") || "";
  const reminder_type = c.req.query("reminder_type") || "";
  const status = c.req.query("status") || "";
  const loan_id = c.req.query("loan_id") || "";
  const page = Math.max(parseInt(c.req.query("page") || "1"), 1);
  const limit = Math.min(Math.max(parseInt(c.req.query("limit") || "25"), 1), 100);
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1=1";
  let params = [];

  if (search) {
    whereClause += ` AND (c.name LIKE ? OR c.phone LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }
  if (reminder_type) {
    whereClause += ` AND r.reminder_type = ?`;
    params.push(reminder_type);
  }
  if (status) {
    whereClause += ` AND r.status = ?`;
    params.push(status);
  }
  if (loan_id) {
    whereClause += ` AND r.loan_id = ?`;
    params.push(parseInt(loan_id));
  }

  const data = await query(
    db,
    `SELECT r.*, c.name as customer_name, c.phone as customer_phone, l.principal as loan_principal
     FROM reminders_log r
     INNER JOIN loans l ON r.loan_id = l.id
     INNER JOIN customers c ON r.customer_id = c.id
     ${whereClause}
     ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const countResult = await queryOne(
    db,
    `SELECT COUNT(*) as count FROM reminders_log r
     INNER JOIN loans l ON r.loan_id = l.id
     INNER JOIN customers c ON r.customer_id = c.id
     ${whereClause}`,
    params
  );

  const total = countResult?.count || 0;
  return c.json({
    data: data || [],
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.max(Math.ceil(total / limit), 1)
    }
  });
}

reminders.get("/", handleListReminders);
reminders.get("/log", handleListReminders);

// POST /api/reminders/send - Mark reminder as sent
reminders.post("/send", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const body = await c.req.json();
  const id = body.id || body.reminder_id;
  if (!id) return c.json({ error: "Reminder ID required" }, 400);

  await run(
    db,
    "UPDATE reminders_log SET status = 'sent', sent_at = datetime('now') WHERE id = ?",
    [id]
  );
  const updated = await queryOne(db, "SELECT * FROM reminders_log WHERE id = ?", [id]);
  return c.json({ success: true, reminder: updated });
});

// PUT /api/reminders/:id - Mark reminder as sent/clicked
reminders.put("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  const existing = await queryOne(db, "SELECT * FROM reminders_log WHERE id = ?", [id]);
  if (!existing) {
    return c.json({ error: "Reminder not found" }, 404);
  }

  const body = await c.req.json();
  const updates = [];
  const values = [];

  if (body.status !== undefined) {
    updates.push("status = ?");
    values.push(body.status);
    if (body.status === "sent" && !body.sent_at) {
      updates.push("sent_at = datetime('now')");
    } else if (body.status === "clicked" && !body.clicked_at) {
      updates.push("clicked_at = datetime('now')");
    }
  }

  if (updates.length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  values.push(id);
  await run(db, `UPDATE reminders_log SET ${updates.join(", ")} WHERE id = ?`, values);

  const updated = await queryOne(db, "SELECT * FROM reminders_log WHERE id = ?", [id]);
  return c.json(updated);
});

// POST /api/reminders/generate-daily & /api/reminders/bulk-generate
async function handleGenerateDaily(c) {
  const db = c.env.DB;
  if (!db) return c.json({ generated_count: 0, date: getToday(), reminders: [] });

  const result = await generateDailyReminders(c.env);
  return c.json({
    generated_count: result.generated_count,
    date: result.date,
    reminders: result.reminders || []
  });
}

reminders.post("/generate-daily", handleGenerateDaily);
reminders.post("/bulk-generate", handleGenerateDaily);

// GET /api/reminders/:id - Get single reminder
reminders.get("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  const reminder = await queryOne(
    db,
    `SELECT r.*, c.name as customer_name, c.phone as customer_phone
     FROM reminders_log r
     INNER JOIN customers c ON r.customer_id = c.id
     WHERE r.id = ?`,
    [id]
  );
  if (!reminder) {
    return c.json({ error: "Reminder not found" }, 404);
  }

  return c.json(reminder);
});

// GET /api/reminders/loan/:loan_id - Get reminders for a specific loan
reminders.get("/loan/:loan_id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ loan_id: 0, reminders: [] });

  const loanId = parseInt(c.req.param("loan_id"));
  const loan = await queryOne(db, "SELECT id FROM loans WHERE id = ?", [loanId]);
  if (!loan) {
    return c.json({ error: "Loan not found" }, 404);
  }

  const remindersList = await query(
    db,
    "SELECT * FROM reminders_log WHERE loan_id = ? ORDER BY created_at DESC",
    [loanId]
  );

  return c.json({ loan_id: loanId, reminders: remindersList || [] });
});

// Export generateDailyReminders for cron worker
export async function generateDailyReminders(env) {
  const db = env?.DB;
  const today = getToday();
  if (!db) return { generated_count: 0, date: today, reminders: [] };

  const settingsMap = await getSettingsMap(db);
  const reminderDaysBefore = parseInt(settingsMap.reminder_days_before_due || "3");
  const autoDefaultDays = parseInt(settingsMap.auto_default_days || "90");

  const generated = [];

  // 1. Due soon reminders
  const dueSoonDate = addDays(today, reminderDaysBefore);
  const dueSoonLoans = await query(
    db,
    `SELECT l.*, c.name as customer_name, c.phone as customer_phone
     FROM loans l
     INNER JOIN customers c ON l.customer_id = c.id
     WHERE l.status = 'active' AND l.next_due_date = ?`,
    [dueSoonDate]
  );

  for (const loan of dueSoonLoans || []) {
    const message = generateReminderMessage(loan, loan, "due_soon", settingsMap);
    const whatsappUrl = generateWhatsAppUrl(loan.customer_phone, message);
    await run(
      db,
      `INSERT INTO reminders_log (loan_id, customer_id, reminder_type, sent_via, status, message, whatsapp_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [loan.id, loan.customer_id, "due_soon", "whatsapp_link", "generated", message, whatsappUrl]
    );
    generated.push({ loan_id: loan.id, reminder_type: "due_soon", whatsapp_url: whatsappUrl });
  }

  // 2. Due today reminders
  const dueTodayLoans = await query(
    db,
    `SELECT l.*, c.name as customer_name, c.phone as customer_phone
     FROM loans l
     INNER JOIN customers c ON l.customer_id = c.id
     WHERE l.status = 'active' AND l.next_due_date = ?`,
    [today]
  );

  for (const loan of dueTodayLoans || []) {
    const message = generateReminderMessage(loan, loan, "due_today", settingsMap);
    const whatsappUrl = generateWhatsAppUrl(loan.customer_phone, message);
    await run(
      db,
      `INSERT INTO reminders_log (loan_id, customer_id, reminder_type, sent_via, status, message, whatsapp_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [loan.id, loan.customer_id, "due_today", "whatsapp_link", "generated", message, whatsappUrl]
    );
    generated.push({ loan_id: loan.id, reminder_type: "due_today", whatsapp_url: whatsappUrl });
  }

  // 3. Overdue reminders (1, 3, 7, 15, 30 days overdue)
  const overdueDaysList = [1, 3, 7, 15, 30];
  for (const days of overdueDaysList) {
    const overdueDate = addDays(today, -days);
    const overdueLoans = await query(
      db,
      `SELECT l.*, c.name as customer_name, c.phone as customer_phone
       FROM loans l
       INNER JOIN customers c ON l.customer_id = c.id
       WHERE l.status = 'active' AND l.next_due_date = ?`,
      [overdueDate]
    );

    for (const loan of overdueLoans || []) {
      const existing = await queryOne(
        db,
        `SELECT id FROM reminders_log WHERE loan_id = ? AND reminder_type = 'overdue' AND date(created_at) = ?`,
        [loan.id, today]
      );
      if (existing) continue;

      const message = generateReminderMessage(loan, loan, "overdue", settingsMap);
      const whatsappUrl = generateWhatsAppUrl(loan.customer_phone, message);
      await run(
        db,
        `INSERT INTO reminders_log (loan_id, customer_id, reminder_type, sent_via, status, message, whatsapp_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [loan.id, loan.customer_id, "overdue", "whatsapp_link", "generated", message, whatsappUrl]
      );
      generated.push({ loan_id: loan.id, reminder_type: "overdue", days_overdue: days, whatsapp_url: whatsappUrl });
    }
  }

  // 4. Auto-default loans older than auto_default_days
  const defaultDate = addDays(today, -autoDefaultDays);
  const defaultLoans = await query(
    db,
    `SELECT id FROM loans WHERE status = 'active' AND next_due_date < ?`,
    [defaultDate]
  );
  for (const loan of defaultLoans || []) {
    await run(db, "UPDATE loans SET status = 'defaulted', updated_at = datetime('now') WHERE id = ?", [loan.id]);
  }

  return { generated_count: generated.length, date: today, reminders: generated };
}

export default reminders;
