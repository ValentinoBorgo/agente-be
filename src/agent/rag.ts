import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
import { collection } from "../database/vector-db";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function chunkText(text, size = 400, overlap = 50) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = start + size;
    chunks.push(text.slice(start, end));
    start += size - overlap;
  }

  return chunks;
}

export function localSearch(query) {
  const folder = process.env.DATA_PATH_TXT || "./data/txt";
  const files = fs.readdirSync(folder);

  const results = [];
  const trace = [];

  const clean = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "");

  const stopwords = [
    "estaciones",
    "estacion",
    "servicio",
    "gasolineras",
    "conoces",
    "quiero",
    "cuales",
    "que",
    "como",
    "donde",
    "de",
    "las",
    "los",
    "para",
    "sobre",
  ];

  const words = clean
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopwords.includes(w));

  trace.push({
    step: "parse_query",
    cleanQuery: clean,
    keywords: words,
  });

  for (const f of files) {
    if (!f.endsWith(".md") && !f.endsWith(".txt")) continue;

    const fullPath = path.join(folder, f);
    const content = fs.readFileSync(fullPath, "utf8");

    trace.push({
      step: "scan_file",
      file: f,
      path: fullPath,
    });

    const lines = content.split(/\r?\n/);

    const matchingLines = lines.filter((line) => {
      const cleanLine = line
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      return words.some((word) => cleanLine.includes(word));
    });

    if (matchingLines.length > 0) {
      trace.push({
        step: "file_match",
        file: f,
        matches: matchingLines.length,
        lines: matchingLines,
      });

      results.push(matchingLines.join("\n"));
    }
  }

  trace.push({
    step: "search_complete",
    totalResults: results.length,
  });

  return { results, trace };
}

export async function addDocument(text) {
  const chunks = chunkText(text);

  for (const chunk of chunks) {
    const embeddingResponse = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: chunk,
    });

    const embedding = embeddingResponse.data[0].embedding;

    await (await collection).add({
      ids: [crypto.randomUUID()],
      embeddings: [embedding],
      metadatas: [{ text: chunk }],
    });
  }

  console.log(`📄 Documento indexado en ${chunks.length}`);
}

export async function searchDocs(query) {
  try {
    const embeddingResponse = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const embedding = embeddingResponse.data[0].embedding;

    const res = await (await collection).query({
      nResults: 3,
      queryEmbeddings: [embedding],
    });

    return res.metadatas?.[0]?.map((m) => m.text) ?? [];
  } catch (err) {
    console.log("Error en RAG :", err);
    const fallback = localSearch(query);
    return fallback ? fallback : ["No se encontró información"];
  }
}
