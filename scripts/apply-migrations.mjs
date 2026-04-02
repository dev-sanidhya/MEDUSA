import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(rootDir, "db", "migrations");

const migrationFiles = (await readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b));

if (migrationFiles.length === 0) {
  console.log("No SQL migrations found.");
  process.exit(0);
}

const client = new Client({
  connectionString,
  ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
});

try {
  await client.connect();

  for (const fileName of migrationFiles) {
    const filePath = path.join(migrationsDir, fileName);
    const sql = await readFile(filePath, "utf8");

    console.log(`Applying ${fileName}...`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Migration failed for ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log("Migrations applied successfully.");
} finally {
  await client.end();
}

function shouldUseSsl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return url.hostname !== "localhost" && url.hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}
