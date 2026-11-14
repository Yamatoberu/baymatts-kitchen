import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { snapshot } from "./recipe.js";
export class StoreError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export async function createStore({
  databaseUrl,
  serverless = false,
  file = "data/kitchen.sqlite",
} = {}) {
  let pool, db;
  if (databaseUrl) {
    const { Pool } = serverless
      ? await import("@neondatabase/serverless")
      : (await import("pg")).default;
    pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 8000,
    });
    try {
      await pool.query("SELECT id FROM recipes LIMIT 0");
    } catch (error) {
      await pool.end();
      throw error;
    }
  } else {
    const { DatabaseSync } = await import("node:sqlite");
    mkdirSync(dirname(file), { recursive: true });
    db = new DatabaseSync(file);
    db.exec(
      "PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; CREATE TABLE IF NOT EXISTS recipes (id TEXT PRIMARY KEY, document TEXT NOT NULL)",
    );
  }
  async function mutate(id, operation) {
    if (pool) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query(
          "SELECT document FROM recipes WHERE id=$1 FOR UPDATE",
          [id],
        );
        const next = operation(result.rows[0]?.document);
        if (next)
          await client.query(
            "INSERT INTO recipes (id,document) VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET document=$2, updated_at=now()",
            [id, JSON.stringify(next)],
          );
        else await client.query("DELETE FROM recipes WHERE id=$1", [id]);
        await client.query("COMMIT");
        return next;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }
    db.exec("BEGIN IMMEDIATE");
    try {
      const row = db.prepare("SELECT document FROM recipes WHERE id=?").get(id);
      const next = operation(row ? JSON.parse(row.document) : undefined);
      if (next)
        db.prepare(
          "INSERT INTO recipes (id,document) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET document=excluded.document",
        ).run(id, JSON.stringify(next));
      else db.prepare("DELETE FROM recipes WHERE id=?").run(id);
      db.exec("COMMIT");
      return next;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  function check(current, revision) {
    if (!current) throw new StoreError(404, "Recipe no longer exists.");
    if (current.revision !== revision)
      throw new StoreError(
        409,
        "This recipe changed in another window. Reload it before saving.",
      );
  }
  return {
    mode: pool ? "postgres" : "local",
    async list() {
      if (pool)
        return (
          await pool.query(
            "SELECT document FROM recipes ORDER BY updated_at DESC",
          )
        ).rows.map((row) => row.document);
      return db
        .prepare(
          "SELECT document FROM recipes ORDER BY json_extract(document, '$.updatedAt') DESC",
        )
        .all()
        .map((row) => JSON.parse(row.document));
    },
    async create(data) {
      const id = randomUUID();
      return mutate(id, () => ({
        ...data,
        id,
        revision: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [],
      }));
    },
    async update(id, data, revision) {
      return mutate(id, (current) => {
        check(current, revision);
        return {
          ...data,
          id,
          revision: current.revision + 1,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
          history: [...current.history, snapshot(current)],
        };
      });
    },
    async delete(id, revision) {
      await mutate(id, (current) => {
        check(current, revision);
        return null;
      });
    },
    async close() {
      if (pool) await pool.end();
      else db.close();
    },
  };
}
