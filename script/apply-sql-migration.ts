import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

async function main() {
  const migrationPathArg = process.argv[2];

  if (!migrationPathArg) {
    throw new Error("Usage: tsx script/apply-sql-migration.ts <migration-file.sql>");
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const migrationPath = resolve(process.cwd(), migrationPathArg);
  const sql = await readFile(migrationPath, "utf-8");

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
    console.log(`Migration applied: ${migrationPathArg}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
