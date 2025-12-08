import { ChromaClient } from "chromadb";
import path from "path";

const CHROMA_DIR = process.env.CHROMA_DIR || path.join(process.cwd(), "data/chroma");

export const chroma = new ChromaClient({
  path: CHROMA_DIR,
});

export const collection = await chroma.getOrCreateCollection({
  name: "rag_docs",
});
