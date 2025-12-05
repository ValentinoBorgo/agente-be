function parseSSE(chunk) {
  const lines = chunk.split("\n");
  for (const l of lines) {
    if (!l.startsWith("data:")) continue;
    const raw = l.replace("data:", "").trim();
    try {
      console.log("📨 EVENT:", JSON.parse(raw));
    } catch {
      console.log("📨 RAW:", raw);
    }
  }
}

async function runChatTest(name, payload) {
  console.log("\n===============================");
  console.log("🧪 CHAT TEST:", name);
  console.log("===============================\n");

  const res = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.body) {
    console.error("❌ No stream body");
    return;
  }

  const reader = res.body.getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += new TextDecoder().decode(value);

    const parts = buffer.split("\n\n");
    buffer = parts.pop();

    for (const p of parts) parseSSE(p);
  }

  console.log("\n✔ TEST COMPLETADO:", name);
}

async function runLocalTest(name, payload) {
  console.log("\n===============================");
  console.log("🧪 LOCAL RAG TEST:", name);
  console.log("===============================\n");

  const res = await fetch("http://localhost:3001/local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.body) {
    console.error("No hay stream");
    return;
  }

  const reader = res.body.getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += new TextDecoder().decode(value);
    const parts = buffer.split("\n\n");
    buffer = parts.pop();

    for (const p of parts) parseSSE(p);
  }

  console.log("\n✔ TEST COMPLETADO:", name);
}

async function runAllTests() {
  await runChatTest("CHAT NORMAL", {
    messages: [{ role: "user", content: "Hola, cómo estás?" }],
  });

  await runChatTest("AUTH OK", {
    messages: [{ role: "user", content: "Soy Valentino, mi código es 123456" }],
  });

  await runChatTest("AUTH FAIL", {
    messages: [{ role: "user", content: "Mi código es 9999" }],
  });

  await runChatTest("LOG INSERT", {
    messages: [
      { role: "user", content: "Registrá un log diciendo que me conecté." },
    ],
  });

  await runLocalTest("RAG LOCAL", {
    query: "Qué estaciones de servicio conoces de Malasia?",
  });

  await runChatTest("ERROR SIMULADO", {
    messages: [
      {
        role: "user",
        content: "Llamá a una tool que no existe, a ver qué pasa.",
      },
    ],
  });
}

runAllTests();
