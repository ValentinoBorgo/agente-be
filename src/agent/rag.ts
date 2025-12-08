import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { getDb } from "../database/postgres.js";

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

async function embedText(text: string): Promise<number[]> {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

export async function addDocument(text: string) {
  const embedding = await embedText(text);

  const embeddingVector = `[${embedding.join(",")}]`;
  const db = getDb();
  await db.query(
    `INSERT INTO rag_docs (text, embedding)
     VALUES ($1, $2)`,
    [text, embeddingVector]
  );
}

export async function searchDocs(query) {
  const db = getDb();

  try {
    // Crear embedding para la query
    const embeddingResponse = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const embedding = embeddingResponse.data[0].embedding;

    const result = await db.query(
      `
      SELECT text
      FROM rag_docs
      ORDER BY embedding <-> $1
      LIMIT 3
      `,
      [embedding]
    );

    if (result.rows.length === 0) return ["⚠️ Sin resultados vectoriales"];

    return result.rows.map((r) => r.text);
  } catch (err) {
    console.log("❌ Error en búsqueda vectorial PGVector:", err);
    const fallback = localSearch(query);
    return fallback ? fallback : ["❌ No se encontró información"];
  }
}
