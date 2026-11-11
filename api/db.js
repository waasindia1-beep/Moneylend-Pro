// Database helper functions for Cloudflare D1 (SQLite)

export async function query(db, sql, params = []) {
  try {
    const stmt = params && params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
    const result = await stmt.all();
    return result.results || [];
  } catch (err) {
    console.error("D1 query error:", sql, params, err);
    throw err;
  }
}

export async function queryOne(db, sql, params = []) {
  try {
    const stmt = params && params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
    return await stmt.first();
  } catch (err) {
    console.error("D1 queryOne error:", sql, params, err);
    throw err;
  }
}

export async function run(db, sql, params = []) {
  try {
    const stmt = params && params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
    return await stmt.run();
  } catch (err) {
    console.error("D1 run error:", sql, params, err);
    throw err;
  }
}
