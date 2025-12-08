import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { addDocument } from "./rag";

export async function indexDocs() {
  const folder = "./data/txt";
  console.log("📁 Indexando documentos desde:", folder);

  const files = fs.readdirSync(folder);

  for (const file of files) {
    const full = path.join(folder, file);
    if (fs.statSync(full).isDirectory()) continue;

    const content = fs.readFileSync(full, "utf8");
    await addDocument(content);

    console.log("📄 Indexado:", file);
  }

  console.log("✅ Indexación completa!");
}

indexDocs();
