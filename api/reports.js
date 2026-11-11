// Money Lending Business Automation - Collection, Defaulter, P&L Reports
// Hono router for /api/reports

import { Hono } from "hono";
import { query, queryOne } from "./db.js";
import { getToday, addDays, daysBetween } from "./utils.js";

const reports = new Hono();

// GET /api/reports/dashboard - High-level dashboard statistics
reports.get("/dashboard", async (c) => {
  const db = c.env.DB;
  const today = getToday();

  if (!db) {
    return c.json({
      date: today,
      total_loans: 0,
      active_loans: 0,
      paid_loans: 0,
      defaulted_loans: 0,
      overdue_loans: 0,
      due_today: 0,
      total_principal: 0,
      total_outstanding: 0,
      total_paid: 0,
      today_collection: 0,
      collection_rate: 0
    });
  }

  const [
    totalLoans,
    activeLoans,
    paidLoans,
    defaultedLoans,
    totals,
    todayCollection,
    overdueLoans,
    dueTodayLoans
  ] = await Promise.all([
    queryOne(db, "SELECT COUNT(*) as count FROM loans"),
    queryOne(db, "SELECT COUNT(*) as count FROM loans WHERE status = 'active'"),
    queryOne(db, "SELECT COUNT(*) as count FROM loans WHERE status = 'paid'"),
    queryOne(db, "SELECT COUNT(*) as count FROM loans WHERE status = 'defaulted'"),
    queryOne(
      db,
      "SELECT COALESCE(SUM(principal), 0) as principal, COALESCE(SUM(outstanding_balance), 0) as outstanding, COALESCE(SUM(total_paid), 0) as paid FROM loans"
    ),
    queryOne(
      db,
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date = ?",
      [today]
    ),
    queryOne(
      db,
      "SELECT COUNT(*) as count FROM loans WHERE status = 'active' AND next_due_date < ?",
      [today]
    ),
    queryOne(
      db,
      "SELECT COUNT(*) as count FROM loans WHERE status = 'active' AND next_due_date = ?",
      [today]
    )
  ]);

  const totalPrincipal = totals?.principal || 0;
  const totalPaid = totals?.paid || 0;
  const collectionRate = totalPrincipal > 0 ? Math.round((totalPaid / (totalPrincipal || 1)) * 100) : 0;

  return c.json({
    date: today,
    total_loans: totalLoans?.count || 0,
    active_loans: activeLoans?.count || 0,
    paid_loans: paidLoans?.count || 0,
    defaulted_loans: defaultedLoans?.count || 0,
    overdue_loans: overdueLoans?.count || 0,
    due_today: dueTodayLoans?.count || 0,
    total_principal: totalPrincipal,
    total_outstanding: totals?.outstanding || 0,
    total_paid: totalPaid,
    today_collection: todayCollection?.total || 0,
    collection_rate: collectionRate
  });
});

// GET /api/reports/collection - Collection report for a date range
reports.get("/collection", async (c) => {
  const db = c.env.DB;
  const start_date = c.req.query("start_date") || addDays(getToday(), -30);
  const end_date = c.req.query("end_date") || getToday();

  if (!db) {
    return c.json({
      start_date,
      end_date,
      total_collected: 0,
      total_count: 0,
      by_date: [],
      by_type: [],
      payments: []
    });
  }

  const payments = await query(
    db,
    `SELECT p.*, c.name as customer_name, c.phone as customer_phone
     FROM payments p
     INNER JOIN loans l ON p.loan_id = l.id
     INNER JOIN customers c ON l.customer_id = c.id
     WHERE p.payment_date >= ? AND p.payment_date <= ?
     ORDER BY p.payment_date DESC, p.id DESC`,
    [start_date, end_date]
  );

  const totalCollected = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalCount = payments?.length || 0;

  // Group by date
  const byDate = {};
  for (const p of payments || []) {
    const d = p.payment_date;
    if (!byDate[d]) {
      byDate[d] = { date: d, amount: 0, count: 0 };
    }
    byDate[d].amount += p.amount || 0;
    byDate[d].count += 1;
  }

  // Group by payment type
  const byType = {};
  for (const p of payments || []) {
    const t = p.payment_type || "regular";
    if (!byType[t]) {
      byType[t] = { type: t, amount: 0, count: 0 };
    }
    byType[t].amount += p.amount || 0;
    byType[t].count += 1;
  }

  return c.json({
    start_date,
    end_date,
    total_collected: Math.round(totalCollected * 100) / 100,
    total_count: totalCount,
    by_date: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)),
    by_type: Object.values(byType),
    payments: payments || []
  });
});

// GET /api/reports/defaulters & /api/reports/defaulter
async function handleDefaulters(c) {
  const db = c.env.DB;
  const days_overdue = parseInt(c.req.query("days_overdue") || "0");
  const today = getToday();

  if (!db) {
    return c.json({
      report_date: today,
      min_days_overdue: days_overdue,
      total_defaulting_loans: 0,
      total_overdue_amount: 0,
      loans: []
    });
  }

  let whereClause = "WHERE l.status = 'active'";
  let params = [];

  if (days_overdue > 0) {
    const cutoffDate = addDays(today, -days_overdue);
    whereClause += ` AND l.next_due_date <= ?`;
    params.push(cutoffDate);
  } else {
    whereClause += ` AND l.next_due_date < ?`;
    params.push(today);
  }

  const loans = await query(
    db,
    `SELECT l.*, c.name as customer_name, c.phone as customer_phone
     FROM loans l
     INNER JOIN customers c ON l.customer_id = c.id
     ${whereClause}
     ORDER BY l.next_due_date ASC`,
    params
  );

  const formattedLoans = (loans || []).map((l) => {
    const overdueDays = l.next_due_date ? Math.max(daysBetween(l.next_due_date, today), 0) : 0;
    return {
      ...l,
      days_overdue: overdueDays
    };
  });

  const totalOverdue = formattedLoans.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0);

  return c.json({
    report_date: today,
    min_days_overdue: days_overdue,
    total_defaulting_loans: formattedLoans.length,
    total_overdue_amount: Math.round(totalOverdue * 100) / 100,
    loans: formattedLoans
  });
}

reports.get("/defaulters", handleDefaulters);
reports.get("/defaulter", handleDefaulters);

// GET /api/reports/pnl & /api/reports/profit-loss
async function handlePnL(c) {
  const db = c.env.DB;
  const start_date = c.req.query("start_date") || addDays(getToday(), -30);
  const end_date = c.req.query("end_date") || getToday();

  if (!db) {
    return c.json({
      start_date,
      end_date,
      total_revenue: 0,
      total_principal_lent_period: 0,
      total_principal_lent_all_time: 0,
      total_outstanding: 0,
      loans_issued_period: 0,
      net_profit: 0
    });
  }

  const [payments, loansIssued, outstanding, allPrincipal] = await Promise.all([
    queryOne(
      db,
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date >= ? AND payment_date <= ?",
      [start_date, end_date]
    ),
    queryOne(
      db,
      "SELECT COALESCE(SUM(principal), 0) as total_principal, COUNT(*) as count FROM loans WHERE start_date >= ? AND start_date <= ?",
      [start_date, end_date]
    ),
    queryOne(db, "SELECT COALESCE(SUM(outstanding_balance), 0) as total FROM loans"),
    queryOne(db, "SELECT COALESCE(SUM(principal), 0) as total FROM loans")
  ]);

  const totalRevenue = payments?.total || 0;
  const totalPrincipalLent = loansIssued?.total_principal || 0;
  const loansCount = loansIssued?.count || 0;

  return c.json({
    start_date,
    end_date,
    total_revenue: totalRevenue,
    total_principal_lent_period: totalPrincipalLent,
    total_principal_lent_all_time: allPrincipal?.total || 0,
    total_outstanding: outstanding?.total || 0,
    loans_issued_period: loansCount,
    net_profit: totalRevenue
  });
}

reports.get("/pnl", handlePnL);
reports.get("/profit-loss", handlePnL);

// GET /api/reports/loan-summary & /api/reports/loan-performance
async function handleLoanSummary(c) {
  const db = c.env.DB;
  if (!db) return c.json({ by_status: [], totals: {} });

  const summary = await query(
    db,
    `SELECT status,
            COUNT(*) as count,
            COALESCE(SUM(principal), 0) as total_principal,
            COALESCE(SUM(total_payable), 0) as total_payable,
            COALESCE(SUM(total_paid), 0) as total_paid,
            COALESCE(SUM(outstanding_balance), 0) as total_outstanding
     FROM loans
     GROUP BY status`
  );

  const totals = await queryOne(
    db,
    `SELECT COUNT(*) as total_loans,
            COALESCE(SUM(principal), 0) as total_principal,
            COALESCE(SUM(total_payable), 0) as total_payable,
            COALESCE(SUM(total_paid), 0) as total_paid,
            COALESCE(SUM(outstanding_balance), 0) as total_outstanding
     FROM loans`
  );

  return c.json({
    by_status: summary || [],
    totals: totals || {}
  });
}

reports.get("/loan-summary", handleLoanSummary);
reports.get("/loan-performance", handleLoanSummary);

export default reports;
