import dotenv from "dotenv";
dotenv.config();

import logger from "./logger.js";
import { createServer } from "./server.js";
import { initDb } from "./database/postgres.js";
import { createUserTask } from "./database/createUserTask.js";

async function start() {
  try {
    validarEntorno();

    await initDb();
    await createUserTask();

    const app = createServer();

    const PORT = Number(process.env.PORT) || 3001;
    const HOST = process.env.HOST || "0.0.0.0";

    app.listen(PORT, HOST, () => {
      logger.info(`Servidor iniciado en ${HOST}:${PORT}`);
      logger.info("POST /api/chat  -> IA");
      logger.info("POST /api/local -> RAG");
    });

    process.on("SIGINT", cerrar);
    process.on("SIGTERM", cerrar);

  } catch (err) {
    logger.error("Error al iniciar el servidor");
    logger.error(err);
    process.exit(1);
  }
}

function validarEntorno() {
  const requeridas = ["PORT", "DATABASE_URL"];

  for (const key of requeridas) {
    if (!process.env[key]) {
      throw new Error(`Falta variable de entorno: ${key}`);
    }
  }
}

function cerrar() {
  logger.warn("Cerrando servidor...");
  process.exit(0);
}

start();
