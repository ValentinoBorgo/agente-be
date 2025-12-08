import { Router } from "express";
import { runAgent } from "../agent/llm.js";
import logger from "../logger.js";

export const chatRouter = Router();

type AuthResult = {
  ok: boolean;
  userId?: number;
  name?: string;
  reason?: string;
};

type RagInput = { query: string };

function isRagInput(input: unknown): input is RagInput {
  return (
    input !== null &&
    typeof input === "object" &&
    "query" in input &&
    typeof (input as any).query === "string"
  );
}

chatRouter.post("/", async (req, res) => {
  try {
    const { messages } = req.body;

    logger.info({ messages }, "📩 Nueva solicitud de chat");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");

    const result = await runAgent(messages);
    let finalText = "";

    const steps = await result.steps;

    for (const step of steps) {
      for (const item of step.content) {
        if (item.type === "reasoning") {
          res.write(
            `data: ${JSON.stringify({
              type: "reasoning",
              text: item.text || "",
            })}\n\n`
          );
          continue;
        }

        if (item.type === "tool-call") {
          res.write(
            `data: ${JSON.stringify({
              type: "tool_call",
              tool: item.toolName,
              args: item.input,
              id: item.toolCallId,
            })}\n\n`
          );
          continue;
        }

        if (item.type === "tool-result") {
          const payload = (item.output || {}) as AuthResult;

          logger.info(
            { tool: item.toolName, result: payload },
            "📦 Resultado de tool"
          );

          let toolMessage = "";

          if (item.toolName === "auth_and_log") {
            toolMessage = payload.ok
              ? `Autenticado correctamente, bienvenido ${payload.name}.`
              : "La autenticación ha fallado. Intenta nuevamente.";
          }

          if (item.toolName === "rag_search") {
            const input = item.input;

            if (!isRagInput(input)) {
              logger.error({ input }, "❌ Input inesperado en rag_search");
              continue;
            }

            const query = input.query;
            const response = item.output;

            let results = [];
            let trace = [];

            if (response && typeof response === "object") {
              results = (response as any).results ?? [];
              trace = (response as any).trace ?? [];
            }

            res.write(
              `data: ${JSON.stringify({
                type: "thinking",
                text: "Buscando coincidencias en documentos locales...",
              })}\n\n`
            );

            res.write(
              `data: ${JSON.stringify({
                type: "trace",
                detail: trace,
              })}\n\n`
            );

            // 3️⃣ Resultado técnico
            res.write(
              `data: ${JSON.stringify({
                type: "local_result",
                query,
                results,
              })}\n\n`
            );

            const finalText = results.length
              ? `Encontré ${results.length} coincidencia(s):\n\n${results.join(
                  "\n"
                )}`
              : `No encontré coincidencias para "${query}".`;

            res.write(
              `data: ${JSON.stringify({
                type: "token",
                token: finalText,
              })}\n\n`
            );

            continue;
          }

          res.write(
            `data: ${JSON.stringify({
              type: "tool_result",
              tool: item.toolName,
              result: payload,
              id: item.toolCallId,
            })}\n\n`
          );

          if (toolMessage) {
            res.write(
              `data: ${JSON.stringify({
                type: "token",
                token: toolMessage,
              })}\n\n`
            );
          }

          continue;
        }
      }
    }

    for await (const token of result.textStream) {
      finalText += token;

      res.write(
        `data: ${JSON.stringify({
          type: "token",
          token,
        })}\n\n`
      );
    }

    logger.info({ response: finalText }, "Respuesta final");

    res.write(`data: ${JSON.stringify({ type: "finish" })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "❌ Error en el endpoint /chat");
    res.status(500).json({ error: "Error al procesar el chat" });
  }
});
