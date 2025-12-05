# 🤖 Agente IA — Backend
Incluye:

- Streaming SSE token-by-token  
- Autenticación conversacional  
- Tools reales ejecutadas por el modelo  
- Persistencia en Postgres  
- RAG local desde archivos  
- Transparencia total del reasoning y pasos internos  
- Logging profesional (Pino)  
- Test suite end-to-end usando SSE  

---

# 🏷 Badges
![Node](https://img.shields.io/badge/node-22.x-brightgreen)
![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--mini-blue)
![Postgres](https://img.shields.io/badge/Postgres-✓-blue)

---

# 📚 Tabla de Contenidos
1. Introducción  
2. Características  
3. Arquitectura  
4. Instalación  
5. Ejecución  
6. Endpoints  
7. Test Suite  
8. Flujo del Agente  
9. Seguridad  
10. Roadmap  
11. Autor  

---

# ⭐ Introducción
Este backend expone un agente de IA capaz de:

- Mantener conversaciones en tiempo real vía **SSE**
- Pensar y mostrar trazas de reasoning
- Autenticarse por chat sin contraseña explícita
- Ejecutar Tools conectadas a Postgres
- Leer archivos locales utilizando RAG
- Devolver respuestas con transparencia total

---

# 🔥 Características principales
✔ Streaming SSE token-by-token  
✔ Autenticación conversacional  
✔ Tools integradas (authenticate_user, insert_log, rag_search)  
✔ RAG local desde `/data/txt  
✔ Logging profesional (Pino)  

---

# 🏗 Arquitectura del Proyecto
/agent
llm.ts
tools.ts
rag.ts

/database
postgres.ts

/routes
chat.route.ts
local.route.ts

logger.ts
server.ts
agent.tests.js


---

# 🔧 Instalación
npm install

---

# ▶️ Ejecución del servidor
npm run dev

---

# 📡 Endpoints

## 🩺 GET /health
Ejemplo:
{
"status": "ok",
"version": "1.0.0",
"environment": "development",
"uptime_seconds": 210,
"db": "connected",
"rag_documents": 12
}


---

## 💬 POST /api/chat
Request:
{
"messages": [
{ "role": "user", "content": "Hola, cómo estás?" }
]
}


Respuesta SSE:
data: {"type":"token","token":"Hola"}
data: {"type":"thinking","text":"Analizando intención..."}
data: {"type":"tool_call","tool":"insert_log"}
data: {"type":"tool_result","result":{"ok":true}}
data: {"type":"token","token":"Estoy bien!"}
data: {"type":"finish"}


---

## 📄 POST /api/local
Request:
{ "query": "Qué estaciones de servicio conoces de Malasia?" }

Devuelve resultados del RAG vía SSE.

---

# 🧪 Test Suite incluido
Ejecutar:
npm run test:agent


Pruebas incluidas:

| Test | Descripción | Tool |
|------|-------------|------|
| CHAT NORMAL | Conversación simple | — |
| AUTH OK | Autenticación válida | authenticate_user |
| AUTH FAIL | Código incorrecto | authenticate_user |
| LOG INSERT | Inserción en DB | insert_log |
| RAG LOCAL | Búsqueda local | rag_search |
| ERROR SIMULADO | Tool inexistente | — |

---

# 🧠 Flujo interno del agente
Usuario
↓
POST /api/chat
↓
streamText() → GPT-4o-mini
↓
Detecta intención
↓
Ejecuta Tool (authenticate_user / insert_log / rag_search)
↓
Devuelve SSE token-by-token

yaml

---

# 🔐 Seguridad
- Contraseñas hasheadas con bcrypt  
- Helmet activo  
- CORS restringido  
- Validación Zod  
- Límite JSON a 1MB  

---

# 🛠 Roadmap
- Memoria conversacional persistente  
- pgvector como vector DB  
- Dashboard visual de logs  
- Autenticación multiusuario  
- Docker + Deploy  
- Métricas y observabilidad  

---

# 👤 Autor
**Valentino Borgo**

**5/12/2025**