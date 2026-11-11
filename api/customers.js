// Money Lending Business Automation - Customer CRUD Endpoints
// Hono router for /api/customers

import { Hono } from "hono";
import { normalizePhone } from "./utils.js";
import { query, queryOne, run } from "./db.js";

const customers = new Hono();

// GET /api/customers - List all with search and pagination
customers.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ data: [], pagination: { page: 1, limit: 25, total: 0, total_pages: 0 } });

  const search = c.req.query("search") || "";
  const page = Math.max(parseInt(c.req.query("page") || "1"), 1);
  const limit = Math.min(Math.max(parseInt(c.req.query("limit") || "25"), 1), 100);
  const offset = (page - 1) * limit;

  let customerList = [];
  let countResult = null;

  if (search) {
    const searchPattern = `%${search}%`;
    customerList = await query(
      db,
      `SELECT * FROM customers 
       WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
       ORDER BY id DESC LIMIT ? OFFSET ?`,
      [searchPattern, searchPattern, searchPattern, limit, offset]
    );
    countResult = await queryOne(
      db,
      `SELECT COUNT(*) as count FROM customers 
       WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?`,
      [searchPattern, searchPattern, searchPattern]
    );
  } else {
    customerList = await query(
      db,
      "SELECT * FROM customers ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    countResult = await queryOne(db, "SELECT COUNT(*) as count FROM customers");
  }

  // Enrich with active loan statistics
  const enrichedData = await Promise.all(
    (customerList || []).map(async (customer) => {
      const stats = await queryOne(
        db,
        "SELECT COUNT(*) as count, COALESCE(SUM(outstanding_balance), 0) as total FROM loans WHERE customer_id = ? AND status = 'active'",
        [customer.id]
      );
      return {
        ...customer,
        active_loans_count: stats?.count || 0,
        total_outstanding: stats?.total || 0
      };
    })
  );

  const total = countResult?.count || 0;
  return c.json({
    data: enrichedData,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.max(Math.ceil(total / limit), 1)
    }
  });
});

// POST /api/customers - Create new customer
customers.post("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  let body = {};
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!body.name || !body.phone) {
    return c.json({ error: "Name and phone are required" }, 400);
  }

  const normalizedPhone = normalizePhone(body.phone);

  // Check if phone already exists
  const existing = await queryOne(db, "SELECT id FROM customers WHERE phone = ?", [normalizedPhone]);
  if (existing) {
    return c.json({ error: "Customer with this phone number already exists" }, 400);
  }

  const result = await run(
    db,
    `INSERT INTO customers (name, phone, email, address, id_proof, id_proof_type, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      body.name.trim(),
      normalizedPhone,
      body.email?.trim() || null,
      body.address?.trim() || null,
      body.id_proof?.trim() || null,
      body.id_proof_type?.trim() || null,
      body.notes?.trim() || null
    ]
  );

  const newId = result?.meta?.last_row_id;
  const newCustomer = await queryOne(db, "SELECT * FROM customers WHERE id = ?", [newId]);
  return c.json(newCustomer || { id: newId, name: body.name, phone: normalizedPhone }, 201);
});

// GET /api/customers/:id - Get single customer with loans summary
customers.get("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

  const customer = await queryOne(db, "SELECT * FROM customers WHERE id = ?", [id]);
  if (!customer) {
    return c.json({ error: "Customer not found" }, 404);
  }

  const loans = await query(
    db,
    "SELECT * FROM loans WHERE customer_id = ? ORDER BY id DESC",
    [id]
  );

  const payments = await query(
    db,
    `SELECT p.*, l.principal as loan_principal 
     FROM payments p 
     INNER JOIN loans l ON p.loan_id = l.id 
     WHERE l.customer_id = ? 
     ORDER BY p.payment_date DESC, p.id DESC`,
    [id]
  );

  return c.json({
    ...customer,
    loans: loans || [],
    payments: payments || []
  });
});

// PUT /api/customers/:id - Update customer
customers.put("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

  const existing = await queryOne(db, "SELECT * FROM customers WHERE id = ?", [id]);
  if (!existing) {
    return c.json({ error: "Customer not found" }, 404);
  }

  const body = await c.req.json();
  const newPhone = body.phone ? normalizePhone(body.phone) : existing.phone;

  // Check phone uniqueness if changed
  if (newPhone !== existing.phone) {
    const phoneExists = await queryOne(
      db,
      "SELECT id FROM customers WHERE phone = ? AND id != ?",
      [newPhone, id]
    );
    if (phoneExists) {
      return c.json({ error: "Phone number already in use" }, 400);
    }
  }

  await run(
    db,
    `UPDATE customers SET 
      name = ?, phone = ?, email = ?, address = ?, 
      id_proof = ?, id_proof_type = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [
      body.name ?? existing.name,
      newPhone,
      body.email !== undefined ? body.email : existing.email,
      body.address !== undefined ? body.address : existing.address,
      body.id_proof !== undefined ? body.id_proof : existing.id_proof,
      body.id_proof_type !== undefined ? body.id_proof_type : existing.id_proof_type,
      body.notes !== undefined ? body.notes : existing.notes,
      id
    ]
  );

  const updated = await queryOne(db, "SELECT * FROM customers WHERE id = ?", [id]);
  return c.json(updated);
});

// DELETE /api/customers/:id - Delete customer (only if no active loans)
customers.delete("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not connected" }, 500);

  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

  const existing = await queryOne(db, "SELECT * FROM customers WHERE id = ?", [id]);
  if (!existing) {
    return c.json({ error: "Customer not found" }, 404);
  }

  // Check for active loans
  const activeLoans = await query(
    db,
    "SELECT id FROM loans WHERE customer_id = ? AND status = 'active'",
    [id]
  );
  if (activeLoans && activeLoans.length > 0) {
    return c.json({ error: "Cannot delete customer with active loans" }, 400);
  }

  await run(db, "DELETE FROM customers WHERE id = ?", [id]);
  return c.json({ success: true, message: "Customer deleted successfully" });
});

export default customers;
