// One-off helper: apply a raw SQL file (a migration) to the database at
// DATABASE_URL. Not part of the running app -- run manually, once per
// migration, e.g.:
//   node --env-file=.env.local scripts/run-sql.mjs supabase/migrations/0002_movies_dataset_schema.sql
import { readFileSync } from "node:fs";
import { Client } from "pg";

const [, , filePath] = process.argv;
if (!filePath) {
  console.error("Usage: node scripts/run-sql.mjs <path-to-sql-file>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (expected in .env.local).");
  process.exit(1);
}

const sql = readFileSync(filePath, "utf8");
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  try {
    await client.query(sql);
    console.log(`Applied ${filePath} successfully.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(`Failed to apply ${filePath}:`, err.message);
  process.exit(1);
});
