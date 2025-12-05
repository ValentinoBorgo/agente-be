import { ChromaClient } from "chromadb";

const client = new ChromaClient({
  path: process.env.CHROMA_PATH,
});

export const collection = await client.getOrCreateCollection({
  name: "rag_docs",
});
