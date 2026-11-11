// Money Lending Business Automation - Calculation Endpoints
// Hono router for /api/calculations

import { Hono } from "hono";
import { queryOne } from "./db.js";

const calculations = new Hono();

// EMI calculation (reducing balance)
export function calculateReducingBalanceEMI(principal, annualRatePercent, tenureMonths) {
  const monthlyRate = annualRatePercent / 100 / 12;
  const n = tenureMonths;
  let emi;
  if (monthlyRate === 0) {
    emi = principal / n;
  } else {
    const onePlusRn = Math.pow(1 + monthlyRate, n);
    emi = (principal * monthlyRate * onePlusRn) / (onePlusRn - 1);
  }
  const totalPayable = emi * n;
  const totalInterest = totalPayable - principal;
  return {
    monthlyEmi: Math.round(emi * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
    monthlyRate
  };
}

// EMI calculation (flat interest)
export function calculateFlatInterestEMI(principal, annualRatePercent, tenureMonths) {
  const totalInterest = (principal * annualRatePercent * tenureMonths) / 100 / 12;
  const totalPayable = principal + totalInterest;
  const monthlyEmi = totalPayable / tenureMonths;
  return {
    monthlyEmi: Math.round(monthlyEmi * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100
  };
}

// Add months to date, adjusting day to due_day
export function addMonthsToDate(dateStr, monthsToAdd, dueDay = 1) {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + monthsToAdd);
  const targetDay = Math.min(Math.max(dueDay, 1), 28);
  d.setDate(targetDay);
  return d.toISOString().split("T")[0];
}

// Generate amortization schedule (reducing balance)
export function generateAmortizationSchedule(principal, annualRatePercent, tenureMonths, startDate, dueDay = 1) {
  const result = calculateReducingBalanceEMI(principal, annualRatePercent, tenureMonths);
  const monthlyRate = result.monthlyRate;
  let balance = principal;
  const schedule = [];

  for (let i = 1; i <= tenureMonths; i++) {
    const interestPortion = balance * monthlyRate;
    const principalPortion = result.monthlyEmi - interestPortion;
    const closingBalance = Math.max(balance - principalPortion, 0);
    const dueDate = addMonthsToDate(startDate, i - 1, dueDay);

    schedule.push({
      installment_number: i,
      due_date: dueDate,
      opening_balance: Math.round(balance * 100) / 100,
      emi: Math.round(result.monthlyEmi * 100) / 100,
      interest_portion: Math.round(interestPortion * 100) / 100,
      principal_portion: Math.round(Math.max(principalPortion, 0) * 100) / 100,
      closing_balance: Math.round(closingBalance * 100) / 100
    });

    balance = closingBalance;
  }

  return { ...result, schedule };
}

// Calculate late fee
export function calculateLateFee(overdueAmount, lateFeePercent, daysOverdue) {
  const rate = lateFeePercent / 100;
  const lateFee = overdueAmount * rate * (daysOverdue > 0 ? 1 : 0);
  const totalPayable = overdueAmount + lateFee;
  return {
    late_fee: Math.round(lateFee * 100) / 100,
    total_payable: Math.round(totalPayable * 100) / 100,
    days_overdue: daysOverdue
  };
}

// Calculate interest (daily/monthly/yearly)
export function calculateInterest(principal, annualRatePercent, period, periodType = "monthly") {
  let interest;
  if (periodType === "daily") {
    const dailyRate = annualRatePercent / 100 / 365;
    interest = principal * dailyRate * period;
  } else if (periodType === "yearly") {
    interest = (principal * annualRatePercent * period) / 100;
  } else {
    const monthlyRate = annualRatePercent / 100 / 12;
    interest = principal * monthlyRate * period;
  }
  const totalAmount = principal + interest;
  return {
    interest_amount: Math.round(interest * 100) / 100,
    total_amount: Math.round(totalAmount * 100) / 100
  };
}

// POST /api/calculations/emi - Calculate EMI
calculations.post("/emi", async (c) => {
  const body = await c.req.json();
  const { principal, interest_rate, annual_rate, interest_type, tenure_months } = body;
  const rate = interest_rate ?? annual_rate;

  if (!principal || rate === undefined || !tenure_months) {
    return c.json({ error: "Principal, interest rate, and tenure months are required" }, 400);
  }

  const type = interest_type || "reducing";
  const numPrincipal = parseFloat(principal);
  const numRate = parseFloat(rate);
  const numTenure = parseInt(tenure_months);

  let result;
  if (type === "flat") {
    result = calculateFlatInterestEMI(numPrincipal, numRate, numTenure);
  } else {
    result = calculateReducingBalanceEMI(numPrincipal, numRate, numTenure);
  }

  return c.json({
    principal: numPrincipal,
    interest_rate: numRate,
    interest_type: type,
    tenure_months: numTenure,
    emi: result.monthlyEmi,
    ...result
  });
});

// POST /api/calculations/schedule - Generate amortization schedule
calculations.post("/schedule", async (c) => {
  const body = await c.req.json();
  const { principal, interest_rate, annual_rate, interest_type, tenure_months, start_date, due_day } = body;
  const rate = interest_rate ?? annual_rate;

  if (!principal || rate === undefined || !tenure_months || !start_date) {
    return c.json({ error: "Principal, interest rate, tenure months, and start date are required" }, 400);
  }

  const type = interest_type || "reducing";
  const numPrincipal = parseFloat(principal);
  const numRate = parseFloat(rate);
  const numTenure = parseInt(tenure_months);
  const day = due_day ? parseInt(due_day) : 5;

  if (type === "flat") {
    const emiResult = calculateFlatInterestEMI(numPrincipal, numRate, numTenure);
    const monthlyEmi = emiResult.monthlyEmi;
    const totalInterest = emiResult.totalInterest;
    const totalPayable = emiResult.totalPayable;
    const schedule = [];
    let remaining = numPrincipal;
    const principalPortion = monthlyEmi - totalInterest / numTenure;

    for (let i = 1; i <= numTenure; i++) {
      const interestPortion = totalInterest / numTenure;
      const dueDate = addMonthsToDate(start_date, i - 1, day);
      remaining = Math.max(remaining - principalPortion, 0);
      schedule.push({
        installment_number: i,
        due_date: dueDate,
        opening_balance: Math.round((remaining + principalPortion) * 100) / 100,
        emi: monthlyEmi,
        interest_portion: Math.round(interestPortion * 100) / 100,
        principal_portion: Math.round(principalPortion * 100) / 100,
        closing_balance: Math.round(remaining * 100) / 100
      });
    }

    return c.json({
      principal: numPrincipal,
      interest_rate: numRate,
      interest_type: type,
      tenure_months: numTenure,
      start_date,
      due_day: day,
      monthly_emi: monthlyEmi,
      total_interest: totalInterest,
      total_payable: totalPayable,
      schedule
    });
  }

  const result = generateAmortizationSchedule(numPrincipal, numRate, numTenure, start_date, day);
  return c.json({
    principal: numPrincipal,
    interest_rate: numRate,
    interest_type: type,
    tenure_months: numTenure,
    start_date,
    due_day: day,
    monthly_emi: result.monthlyEmi,
    total_interest: result.totalInterest,
    total_payable: result.totalPayable,
    schedule: result.schedule
  });
});

// POST /api/calculations/late-fee - Calculate late fee
calculations.post("/late-fee", async (c) => {
  const body = await c.req.json();
  const { overdue_amount, late_fee_percent, days_overdue } = body;

  if (!overdue_amount || late_fee_percent === undefined || days_overdue === undefined) {
    return c.json({ error: "Overdue amount, late fee percent, and days overdue are required" }, 400);
  }

  const result = calculateLateFee(parseFloat(overdue_amount), parseFloat(late_fee_percent), parseInt(days_overdue));
  return c.json(result);
});

// POST /api/calculations/interest - Calculate interest
calculations.post("/interest", async (c) => {
  const body = await c.req.json();
  const { principal, interest_rate, period, period_type } = body;

  if (!principal || interest_rate === undefined || !period) {
    return c.json({ error: "Principal, interest rate, and period are required" }, 400);
  }

  const result = calculateInterest(parseFloat(principal), parseFloat(interest_rate), parseFloat(period), period_type);
  return c.json(result);
});

// GET /api/calculations/loan/:id - Get loan calculation details with schedule
calculations.get("/loan/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  const loan = await queryOne(db, "SELECT * FROM loans WHERE id = ?", [id]);
  if (!loan) {
    return c.json({ error: "Loan not found" }, 404);
  }

  const schedule = generateAmortizationSchedule(
    loan.principal,
    loan.interest_rate,
    loan.tenure_months,
    loan.start_date,
    loan.due_day
  );

  return c.json({
    loan,
    ...schedule
  });
});

export default calculations;
