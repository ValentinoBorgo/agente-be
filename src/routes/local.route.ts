import { Router } from "express";
import { localSearch } from "../agent/rag.js";

export const localRouter = Router();

localRouter.post("/", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Falta de campo query" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");

    res.write(
      `data: ${JSON.stringify({
        type: "thinking",
        text: `Buscando coincidencias en documentos locales...`,
      })}\n\n`
    );

    const { results, trace } = localSearch(query);

    res.write(
      `data: ${JSON.stringify({
        type: "trace",
        detail: trace,
      })}\n\n`
    );

    res.write(
      `data: ${JSON.stringify({
        type: "local_result",
        query,
        results,
      })}\n\n`
    );

    res.write(`data: ${JSON.stringify({ type: "finish" })}\n\n`);
    res.end();
  } catch (err) {
    console.error("❌ RAG error:", err);
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: err.message,
      })}\n\n`
    );
    res.end();
  }
});
