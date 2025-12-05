import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

let pool;

export function getDb() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("❌ DATABASE_URL no existe");
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  return pool;
}

export async function initDb() {
  const db = getDb();

  try {
    await db.query("SELECT NOW()");
    console.log("📦 Postgres conectado correctamente");
  } catch (err) {
    console.error("❌ Error conectando a Postgres:", err);
    process.exit(1);
  }
}
