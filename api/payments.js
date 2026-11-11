// Money Lending Business Automation - Payment Recording + History
// Hono router for /api/payments

import { Hono } from "hono";
import { query, queryOne, run } from "./db.js";
import { addMonthsToDate } from "./calculations.js";
import { getToday } from "./utils.js";

const payments = new Hono();

// POST /api/payments - Record a new payment
payments.post("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  let body = {};
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { loan_id, amount, payment_date, payment_type, notes, recorded_by } = body;

  if (!loan_id || !amount || parseFloat(amount) <= 0) {
    return c.json({ error: "Valid loan ID and amount are required" }, 400);
  }

  const loanId = parseInt(loan_id);
  const payAmount = parseFloat(amount);
  const date = payment_date || getToday();
  const type = payment_type || "regular";

  // Verify loan exists
  const loan = await queryOne(db, "SELECT * FROM loans WHERE id = ?", [loanId]);
  if (!loan) {
    return c.json({ error: "Loan not found" }, 404);
  }

  // Insert payment
  const result = await run(
    db,
    `INSERT INTO payments (loan_id, amount, payment_date, payment_type, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [loanId, payAmount, date, type, notes?.trim() || null, recorded_by || "User"]
  );

  const newPaymentId = result?.meta?.last_row_id;

  // Update loan totals
  const newTotalPaid = Math.round(((loan.total_paid || 0) + payAmount) * 100) / 100;
  const currentOutstanding = loan.outstanding_balance !== null ? loan.outstanding_balance : loan.total_payable;
  const newOutstanding = Math.max(Math.round((currentOutstanding - payAmount) * 100) / 100, 0);

  let newStatus = loan.status;
  if (newOutstanding <= 0.01) {
    newStatus = "paid";
  } else if (loan.status === "paid" && newOutstanding > 0) {
    newStatus = "active";
  }

  // Advance next due date if regular payment and loan still active
  let nextDueDate = loan.next_due_date;
  if (type === "regular" && newOutstanding > 0 && loan.next_due_date) {
    nextDueDate = addMonthsToDate(loan.next_due_date, 1, loan.due_day || 5);
  }

  await run(
    db,
    `UPDATE loans SET
       total_paid = ?,
       outstanding_balance = ?,
       last_payment_date = ?,
       next_due_date = ?,
       status = ?,
       updated_at = datetime('now')
     WHERE id = ?`,
    [newTotalPaid, newOutstanding, date, nextDueDate, newStatus, loanId]
  );

  const newPayment = await queryOne(db, "SELECT * FROM payments WHERE id = ?", [newPaymentId]);
  const updatedLoan = await queryOne(db, "SELECT * FROM loans WHERE id = ?", [loanId]);

  return c.json(
    {
      payment: newPayment,
      loan: updatedLoan
    },
    201
  );
});

// GET /api/payments - List payments with filters and pagination
payments.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ data: [], pagination: { page: 1, limit: 25, total: 0, total_pages: 0 } });

  const search = c.req.query("search") || "";
  const loan_id = c.req.query("loan_id") || "";
  const payment_type = c.req.query("payment_type") || "";
  const start_date = c.req.query("start_date") || "";
  const end_date = c.req.query("end_date") || "";
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
  if (loan_id) {
    whereClause += ` AND p.loan_id = ?`;
    params.push(parseInt(loan_id));
  }
  if (payment_type) {
    whereClause += ` AND p.payment_type = ?`;
    params.push(payment_type);
  }
  if (start_date) {
    whereClause += ` AND p.payment_date >= ?`;
    params.push(start_date);
  }
  if (end_date) {
    whereClause += ` AND p.payment_date <= ?`;
    params.push(end_date);
  }

  const data = await query(
    db,
    `SELECT p.*, c.name as customer_name, c.phone as customer_phone, l.principal as loan_principal
     FROM payments p
     INNER JOIN loans l ON p.loan_id = l.id
     INNER JOIN customers c ON l.customer_id = c.id
     ${whereClause}
     ORDER BY p.payment_date DESC, p.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const countResult = await queryOne(
    db,
    `SELECT COUNT(*) as count FROM payments p
     INNER JOIN loans l ON p.loan_id = l.id
     INNER JOIN customers c ON l.customer_id = c.id
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
});

// GET /api/payments/:id - Get single payment
payments.get("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  const payment = await queryOne(
    db,
    `SELECT p.*, c.name as customer_name, c.phone as customer_phone, l.principal as loan_principal
     FROM payments p
     INNER JOIN loans l ON p.loan_id = l.id
     INNER JOIN customers c ON l.customer_id = c.id
     WHERE p.id = ?`,
    [id]
  );
  if (!payment) {
    return c.json({ error: "Payment not found" }, 404);
  }

  return c.json(payment);
});

// DELETE /api/payments/:id - Delete payment and recalculate loan
payments.delete("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  const payment = await queryOne(db, "SELECT * FROM payments WHERE id = ?", [id]);
  if (!payment) {
    return c.json({ error: "Payment not found" }, 404);
  }

  const loan = await queryOne(db, "SELECT * FROM loans WHERE id = ?", [payment.loan_id]);

  // Delete payment
  await run(db, "DELETE FROM payments WHERE id = ?", [id]);

  // Recalculate loan totals
  if (loan) {
    const newTotalPaid = Math.max((loan.total_paid || 0) - payment.amount, 0);
    const newOutstanding = Math.min((loan.outstanding_balance || 0) + payment.amount, loan.total_payable);
    const newStatus = newOutstanding > 0 ? "active" : "paid";

    await run(
      db,
      `UPDATE loans SET
         total_paid = ?,
         outstanding_balance = ?,
         status = ?,
         updated_at = datetime('now')
       WHERE id = ?`,
      [newTotalPaid, newOutstanding, newStatus, loan.id]
    );
  }

  return c.json({ success: true, message: "Payment deleted and loan recalculated" });
});

// GET /api/payments/loan/:loan_id/history - Payment history for a loan
payments.get("/loan/:loan_id/history", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ loan_id: 0, total_payments: 0, total_paid: 0, payments: [] });

  const loanId = parseInt(c.req.param("loan_id"));
  const loan = await queryOne(db, "SELECT id FROM loans WHERE id = ?", [loanId]);
  if (!loan) {
    return c.json({ error: "Loan not found" }, 404);
  }

  const paymentsList = await query(
    db,
    "SELECT * FROM payments WHERE loan_id = ? ORDER BY payment_date DESC, id DESC",
    [loanId]
  );

  const totalPaid = (paymentsList || []).reduce((sum, p) => sum + (p.amount || 0), 0);

  return c.json({
    loan_id: loanId,
    total_payments: paymentsList?.length || 0,
    total_paid: Math.round(totalPaid * 100) / 100,
    payments: paymentsList || []
  });
});

export default payments;
