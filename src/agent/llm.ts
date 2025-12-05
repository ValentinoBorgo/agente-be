import { streamText } from "ai";
import { tools } from "./tools.js";
import { openai } from "./openai";

export async function runAgent(messages) {
  return streamText({
    model: openai("gpt-4o-mini"),
    messages,
    tools,
  });
}
