import { ChromaClient } from "chromadb";

export const chroma = new ChromaClient();

export const collection = chroma.getOrCreateCollection({
  name: "rag_docs",
});
