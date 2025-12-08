import { ChromaClient } from "chromadb";

export const client = new ChromaClient({
  host: process.env.CHROMA_HOST || "localhost",
  port: Number(process.env.CHROMA_PORT) || 8000,
  ssl: false,
});

export const collection = await client.getOrCreateCollection({
  name: "rag_docs",
});
