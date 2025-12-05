import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import logger from "./logger.js";

import { chatRouter } from "./routes/chat.route.js";
import { localRouter } from "./routes/local.route.js";
import helmet from "helmet";

export function createServer() {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "1mb" }));

  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });

  const API_PREFIX = process.env.API_PREFIX || "/api";

  app.use(`${API_PREFIX}/chat`, chatRouter);
  app.use(`${API_PREFIX}/local`, localRouter);

  app.get("/health", (_, res) => res.json({ status: "ok" }));

  app.use((err, req, res, next) => {
    logger.error(
      {
        error: {
          message: err.message,
          stack: err.stack,
          path: req.path,
          method: req.method,
        },
      },
      "Error no manejado"
    );

    res.status(500).json({ error: "Error interno del servidor" });
  });

  return app;
}
