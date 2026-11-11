// Money Lending Business Automation - Loan CRUD + Schedule Generation
// Hono router for /api/loans

import { Hono } from "hono";
import { query, queryOne, run } from "./db.js";
import {
  calculateReducingBalanceEMI,
  calculateFlatInterestEMI,
  generateAmortizationSchedule,
  addMonthsToDate,
  calculateLateFee
} from "./calculations.js";
import { getToday, daysBetween } from "./utils.js";

const loans = new Hono();

// GET /api/loans - List all loans with filters and pagination
loans.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ data: [], pagination: { page: 1, limit: 25, total: 0, total_pages: 0 } });

  const search = c.req.query("search") || "";
  const status = c.req.query("status") || "";
  const customer_id = c.req.query("customer_id") || "";
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
  if (status) {
    whereClause += ` AND l.status = ?`;
    params.push(status);
  }
  if (customer_id) {
    whereClause += ` AND l.customer_id = ?`;
    params.push(parseInt(customer_id));
  }

  const data = await query(
    db,
    `SELECT l.*, c.name as customer_name, c.phone as customer_phone
     FROM loans l
     INNER JOIN customers c ON l.customer_id = c.id
     ${whereClause}
     ORDER BY l.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const countResult = await queryOne(
    db,
    `SELECT COUNT(*) as count FROM loans l
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

// POST /api/loans - Create new loan with schedule
loans.post("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  let body = {};
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { customer_id, principal, interest_rate, interest_type, tenure_months, start_date, due_day, grace_days, late_fee_percent } = body;

  if (!customer_id || !principal || interest_rate === undefined || !tenure_months || !start_date) {
    return c.json({ error: "Customer ID, principal, interest rate, tenure months, and start date are required" }, 400);
  }

  // Verify customer exists
  const customer = await queryOne(db, "SELECT id FROM customers WHERE id = ?", [customer_id]);
  if (!customer) {
    return c.json({ error: "Customer not found" }, 404);
  }

  const numPrincipal = parseFloat(principal);
  const numRate = parseFloat(interest_rate);
  const numTenure = parseInt(tenure_months);
  const type = interest_type || "reducing";
  const day = due_day ? parseInt(due_day) : 5;
  const grace = grace_days !== undefined ? parseInt(grace_days) : 0;
  const lateFee = late_fee_percent !== undefined ? parseFloat(late_fee_percent) : 2;

  // Calculate EMI and schedule
  let calcResult;
  if (type === "flat") {
    calcResult = calculateFlatInterestEMI(numPrincipal, numRate, numTenure);
  } else {
    calcResult = calculateReducingBalanceEMI(numPrincipal, numRate, numTenure);
  }

  const emi = calcResult.monthlyEmi;
  const totalPayable = calcResult.totalPayable;

  // Calculate first due date
  const nextDueDate = addMonthsToDate(start_date, 1, day);

  const result = await run(
    db,
    `INSERT INTO loans (
       customer_id, principal, interest_rate, interest_type, tenure_months,
       emi, start_date, due_day, status, total_payable, total_paid,
       outstanding_balance, last_payment_date, next_due_date, grace_days, late_fee_percent
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customer_id,
      numPrincipal,
      numRate,
      type,
      numTenure,
      emi,
      start_date,
      day,
      "active",
      totalPayable,
      0,
      totalPayable,
      null,
      nextDueDate,
      grace,
      lateFee
    ]
  );

  const newId = result?.meta?.last_row_id;
  const newLoan = await queryOne(
    db,
    `SELECT l.*, c.name as customer_name, c.phone as customer_phone
     FROM loans l
     INNER JOIN customers c ON l.customer_id = c.id
     WHERE l.id = ?`,
    [newId]
  );

  const schedule = generateAmortizationSchedule(numPrincipal, numRate, numTenure, start_date, day);

  return c.json({
    loan: newLoan,
    schedule: schedule.schedule || schedule
  }, 201);
});

// GET /api/loans/:id - Get single loan with schedule and payments
loans.get("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

  const loan = await queryOne(
    db,
    `SELECT l.*, c.name as customer_name, c.phone as customer_phone
     FROM loans l
     INNER JOIN customers c ON l.customer_id = c.id
     WHERE l.id = ?`,
    [id]
  );
  if (!loan) {
    return c.json({ error: "Loan not found" }, 404);
  }

  const payments = await query(
    db,
    "SELECT * FROM payments WHERE loan_id = ? ORDER BY payment_date DESC, id DESC",
    [id]
  );

  const schedule = generateAmortizationSchedule(
    loan.principal,
    loan.interest_rate,
    loan.tenure_months,
    loan.start_date,
    loan.due_day
  );

  return c.json({
    ...loan,
    schedule: schedule.schedule || schedule,
    payments: payments || []
  });
});

// GET /api/loans/:id/schedule - Full amortization schedule
loans.get("/:id/schedule", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  const loan = await queryOne(db, "SELECT * FROM loans WHERE id = ?", [id]);
  if (!loan) return c.json({ error: "Loan not found" }, 404);

  const schedule = generateAmortizationSchedule(
    loan.principal,
    loan.interest_rate,
    loan.tenure_months,
    loan.start_date,
    loan.due_day
  );

  return c.json({
    loan_id: id,
    monthly_emi: schedule.monthlyEmi,
    total_interest: schedule.totalInterest,
    total_payable: schedule.totalPayable,
    schedule: schedule.schedule || schedule
  });
});

// GET /api/loans/:id/outstanding - Outstanding details & overdue status
loans.get("/:id/outstanding", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  const loan = await queryOne(db, "SELECT * FROM loans WHERE id = ?", [id]);
  if (!loan) return c.json({ error: "Loan not found" }, 404);

  const today = getToday();
  const isOverdue = loan.next_due_date ? loan.next_due_date < today : false;
  const daysOverdue = isOverdue ? daysBetween(loan.next_due_date, today) : 0;
  const lateFeeCalc = calculateLateFee(loan.outstanding_balance, loan.late_fee_percent || 0, daysOverdue);

  return c.json({
    loan_id: id,
    principal: loan.principal,
    total_payable: loan.total_payable,
    total_paid: loan.total_paid,
    outstanding_balance: loan.outstanding_balance,
    emi: loan.emi,
    next_due_date: loan.next_due_date,
    is_overdue: isOverdue,
    days_overdue: daysOverdue,
    late_fee: lateFeeCalc.late_fee,
    total_due_with_late_fee: lateFeeCalc.total_payable
  });
});

// PUT /api/loans/:id - Update loan
loans.put("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  const existing = await queryOne(db, "SELECT * FROM loans WHERE id = ?", [id]);
  if (!existing) {
    return c.json({ error: "Loan not found" }, 404);
  }

  const body = await c.req.json();
  const updates = [];
  const values = [];

  const fields = [
    "principal", "interest_rate", "interest_type", "tenure_months",
    "emi", "start_date", "due_day", "status", "total_payable",
    "total_paid", "outstanding_balance", "last_payment_date",
    "next_due_date", "grace_days", "late_fee_percent"
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  }

  if (updates.length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  await run(db, `UPDATE loans SET ${updates.join(", ")} WHERE id = ?`, values);

  const updated = await queryOne(db, "SELECT * FROM loans WHERE id = ?", [id]);
  return c.json(updated);
});

// DELETE /api/loans/:id - Delete loan (only if no payments)
loans.delete("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  const existing = await queryOne(db, "SELECT * FROM loans WHERE id = ?", [id]);
  if (!existing) {
    return c.json({ error: "Loan not found" }, 404);
  }

  const payments = await query(db, "SELECT id FROM payments WHERE loan_id = ?", [id]);
  if (payments && payments.length > 0) {
    return c.json({ error: "Cannot delete loan with existing payments" }, 400);
  }

  await run(db, "DELETE FROM loans WHERE id = ?", [id]);
  return c.json({ success: true, message: "Loan deleted successfully" });
});

export default loans;
