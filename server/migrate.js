import { readFile } from "node:fs/promises";
import pg from "pg";
const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString)
  throw new Error(
    "Set DATABASE_URL_UNPOOLED or DATABASE_URL before running migrations.",
  );
const pool = new pg.Pool({ connectionString });
try {
  await pool.query(
    await readFile(
      new URL("../migrations/001_recipes.sql", import.meta.url),
      "utf8",
    ),
  );
  console.log("Recipe schema is ready.");
} finally {
  await pool.end();
}
