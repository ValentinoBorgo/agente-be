import { z } from "zod";
import { searchDocs } from "./rag";
import bcrypt from "bcrypt";
import { getDb } from "../database/postgres";

export const tools = {
  authenticate_user: {
    description: "Autentica usuario por nombre + código",
    inputSchema: z.object({
      name: z.string(),
      code: z.string(),
    }),

    async execute({ name, code }) {
      const db = getDb();
      const result = await db.query(
        "SELECT id, name, password FROM users WHERE name = $1",
        [name]
      );

      if (result.rows.length === 0) return { ok: false };

      const user = result.rows[0];

      const match = await bcrypt.compare(code, user.password);

      return match
        ? { ok: true, userId: user.id, name: user.name }
        : { ok: false };
    },
  },

  insert_log: {
    description: "Inserta logs en Postgres",
    inputSchema: z.object({
      userId: z.number(),
      message: z.string(),
    }),
    async execute({ userId, message }) {
      const db = getDb();
      await db.query("INSERT INTO logs (user_id, message) VALUES ($1, $2)", [
        userId,
        message,
      ]);
      return { ok: true };
    },
  },

  rag_search: {
    description: "Busca info en documentos locales",
    inputSchema: z.object({ query: z.string() }),
    async execute({ query }) {
      return await searchDocs(query);
    },
  },
};
