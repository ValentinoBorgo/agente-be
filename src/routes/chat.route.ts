import { Router } from "express";
import { runAgent } from "../agent/llm.js";
import logger from "../logger.js";

export const chatRouter = Router();

chatRouter.post("/", async (req, res) => {
  try {
    const { messages } = req.body;

    logger.info({ messages }, "📩 Nueva solicitud de chat");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");

    const result = await runAgent(messages);

    let finalText: string;
    for await (const token of result.textStream) {
      finalText += token;
      logger.debug({ token }, "💬 Token generado");
      res.write(`data: ${JSON.stringify({ type: "token", token })}\n\n`);
    }

    for (const step of await result.steps) {
      logger.debug({ step }, "🔍 Step de razonamiento recibido");

      for (const item of step.content) {
        logger.debug({ item }, "🔹 Item dentro del step");

        if (item.type === "reasoning") {
          res.write(
            `data: ${JSON.stringify({
              type: "thinking",
              text: item.text,
            })}\n\n`
          );
        }

        if (item.type === "tool-call") {
          logger.info(
            { tool: item.toolName, args: item.input },
            "🛠 Llamada a tool detectada"
          );

          res.write(
            `data: ${JSON.stringify({
              type: "tool_call",
              tool: item.toolName,
              args: item.input,
              id: item.toolCallId,
            })}\n\n`
          );
        }

        if (item.type === "tool-result") {
          logger.info(
            { tool: item.toolName, result: item.output },
            "📦 Resultado de tool"
          );

          res.write(
            `data: ${JSON.stringify({
              type: "tool_result",
              tool: item.toolName,
              result: item.output,
              id: item.toolCallId,
            })}\n\n`
          );
        }
      }
    }

    logger.info({ response: finalText }, "Respuesta final");

    res.write(`data: ${JSON.stringify({ type: "finish" })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "❌ Error en el endpoint /chat");
    res.status(500).json({ error: "Error al procesar el chat" });
  }
});
