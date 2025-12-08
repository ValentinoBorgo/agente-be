import bcrypt from "bcrypt";
import { getDb } from "./postgres";

export async function createUserTask() {
  const db = getDb();

  const seedName = process.env.SEED_USER_NAME;
  const seedPassword = process.env.SEED_USER_PASSWORD;

  if (!seedName || !seedPassword) {
    console.log(
      "⚠️ Usuario inicial no configurado (faltan variables de entorno)"
    );
    return;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const existing = await db.query("SELECT id FROM users WHERE name = $1", [
    seedName,
  ]);

  if (existing.rows.length > 0) {
    console.log("✔ Usuario inicial ya existe");
    return;
  }

  const hash = await bcrypt.hash(seedPassword, 10);

  await db.query("INSERT INTO users (name, password) VALUES ($1, $2)", [
    seedName,
    hash,
  ]);

  console.log(`✔ Usuario '${seedName}' creado automáticamente`);
}
