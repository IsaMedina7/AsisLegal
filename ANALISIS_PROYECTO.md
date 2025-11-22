# Análisis Completo - Proyecto AsisLegal

## 📋 Descripción General

**AsisLegal** es una aplicación web fullstack que permite a usuarios subir documentos legales (PDFs) y realizar consultas sobre ellos mediante IA. La aplicación utiliza arquitectura de microservicios con:

- **Frontend**: HTML5 + JavaScript vanilla (Bootstrap 5)
- **Backend**: Laravel (PHP) - API REST
- **Microservicio IA**: FastAPI (Python) - Procesamiento de PDFs con LangChain

---

## 🏗️ Arquitectura del Proyecto

```
AsisLegal/
├── frontend/              # Interfaz del usuario
│   ├── index.html        # Estructura HTML
│   ├── app.js            # Lógica JavaScript
│   └── styles.css        # Estilos
│
├── backend/              # API REST (Laravel)
│   ├── app/
│   │   ├── Controllers/
│   │   │   ├── ChatController.php    # Gestor de chats y mensajes
│   │   │   └── otros...
│   │   └── Models/
│   │       ├── User.php             # Usuario
│   │       ├── Chat.php             # Conversación
│   │       ├── Message.php          # Mensajes
│   │       └── Document.php         # Documentos
│   ├── routes/
│   │   └── api.php                  # Rutas API
│   ├── database/
│   │   ├── migrations/              # Definición de tablas
│   │   └── factories/               # Datos de prueba
│   └── storage/
│       └── app/
│           └── public/              # Documentos almacenados
│
└── microservicio_ia/     # Motor de IA (FastAPI)
    ├── main.py           # Endpoint /api/chat-documentos
    └── requirements.txt  # Dependencias Python
```

---

## 📊 Base de Datos

### Tablas Principales

```
users
├── id (PK)
├── name
├── email
└── password

documents
├── id_document (PK)
├── nombre
├── file_path
└── id_user (FK)

chats
├── id_chat (PK)
├── title
├── id_document (FK)
├── id_user (FK)
└── timestamps

messages
├── id_message (PK)
├── id_chat (FK)
├── sender ('user' | 'IA')
├── content
└── timestamps
```

### Relaciones
- **User** → **Document** (1:N)
- **User** → **Chat** (1:N)
- **Document** → **Chat** (1:N)
- **Chat** → **Message** (1:N)

---

## 🔗 API REST - Rutas Disponibles

Todas las rutas tienen prefijo `/api`. Base URL: `http://127.0.0.1:8000`

### 1️⃣ Obtener todos los chats del usuario
```http
GET /api/chats
```

**Respuesta (200):**
```json
{
  "status": "success",
  "data": [
    {
      "id_chat": 1,
      "title": "Chat: contrato.pdf",
      "id_document": 1,
      "id_user": 1,
      "created_at": "2025-11-22T17:10:44Z",
      "updated_at": "2025-11-22T17:10:44Z"
    }
  ]
}
```

### 2️⃣ Crear nuevo chat (subir documento)
```http
POST /api/chats
Content-Type: multipart/form-data

Body:
- pdf_file: [archivo PDF]
- titulo: [título opcional]
```

**Respuesta (201):**
```json
{
  "status": "success",
  "message": "Chat creado correctamente",
  "data": {
    "id_chat": 1,
    "title": "Chat: documento.pdf",
    "id_document": 1,
    "id_user": 1,
    "created_at": "2025-11-22T17:10:44Z"
  }
}
```

**Errores:**
- `422`: Validación fallida (archivo no PDF, tamaño > 10MB, etc.)
- `500`: Error interno

### 3️⃣ Obtener chat específico con mensajes
```http
GET /api/chats/{id}
```

**Respuesta (200):**
```json
{
  "status": "success",
  "data": {
    "id_chat": 1,
    "title": "Chat: contrato.pdf",
    "id_document": 1,
    "id_user": 1,
    "created_at": "2025-11-22T17:10:44Z",
    "document": {
      "id_document": 1,
      "nombre": "contrato.pdf",
      "file_path": "documentos/contrato.pdf",
      "id_user": 1
    },
    "messages": [
      {
        "id_message": 1,
        "id_chat": 1,
        "sender": "user",
        "content": "¿Cuáles son los términos principales?",
        "created_at": "2025-11-22T17:15:00Z"
      },
      {
        "id_message": 2,
        "id_chat": 1,
        "sender": "IA",
        "content": "Los términos principales incluyen...",
        "created_at": "2025-11-22T17:15:05Z"
      }
    ]
  }
}
```

**Errores:**
- `404`: Chat no encontrado

### 4️⃣ Enviar mensaje y obtener respuesta de IA
```http
POST /api/chats/{id}/mensaje
Content-Type: application/json

Body:
{
  "content": "¿Cuáles son mis obligaciones?"
}
```

**Respuesta (200):**
```json
{
  "status": "success",
  "user_message": {
    "id_message": 3,
    "id_chat": 1,
    "sender": "user",
    "content": "¿Cuáles son mis obligaciones?",
    "created_at": "2025-11-22T17:20:00Z"
  },
  "ai_message": {
    "id_message": 4,
    "id_chat": 1,
    "sender": "IA",
    "content": "Según el documento, tus obligaciones son...",
    "created_at": "2025-11-22T17:20:05Z"
  },
  "audio_base64": "//NExAASDZs..."
}
```

**Flujo interno:**
1. Laravel guarda mensaje del usuario
2. Laravel envía PDF + pregunta a FastAPI
3. FastAPI procesa con RAG (LangChain + Gemini)
4. FastAPI genera audio con gTTS
5. Laravel guarda respuesta y devuelve todo

**Errores:**
- `404`: Chat no encontrado
- `404`: Archivo PDF no existe
- `503`: No hay conexión con microservicio IA

---

## 🎯 Flujo de Usuario

### Pantalla 1: Bienvenida
```
┌─────────────────────────────┐
│       AsisLegal             │
│  Bienvenido...              │
│                             │
│  [Crear consulta]           │
└─────────────────────────────┘
```

**Acción:** Click en "Crear consulta"

### Pantalla 2: Chat + Documentos
```
┌──────────────────────────────────────────────────────┐
│  Chat                    │  Documentos              │
│                          │  [Subir documentos]      │
│ ┌─────────────────────┐  │  ┌──────────────────┐    │
│ │ Bot: No hay mens.   │  │  │ contrato.pdf [V] │    │
│ │                     │  │  │ solicitud.pdf [V]│    │
│ └─────────────────────┘  │  └──────────────────┘    │
│                          │                          │
│ [Reproducir]  [Volver]   │                          │
│                          │                          │
│ [Escribe pregunta...]    │                          │
│            [Enviar]      │                          │
└──────────────────────────────────────────────────────┘
```

**Flujo:**
1. Usuario sube PDFs → POST `/api/chats`
2. Se crea chat y documento en BD
3. Usuario escribe pregunta → POST `/api/chats/{id}/mensaje`
4. IA procesa y responde
5. Respuesta se muestra + audio disponible

---

## 🔄 Integración Frontend ↔ Backend

### Operación 1: Cargar lista de chats
```javascript
// Frontend: app.js
async loadChats() {
  const response = await fetch('http://127.0.0.1:8000/api/chats');
  const data = await response.json();
  // Renderizar chats en lista
}
```

### Operación 2: Subir documento
```javascript
// Frontend: app.js
async uploadDocuments(files) {
  const formData = new FormData();
  formData.append('pdf_file', files[0]);
  formData.append('titulo', 'Mi documento');
  
  const response = await fetch('http://127.0.0.1:8000/api/chats', {
    method: 'POST',
    body: formData
  });
  const data = await response.json();
  // Crear nuevo chat en UI
}
```

### Operación 3: Enviar pregunta a IA
```javascript
// Frontend: app.js
async sendQuestion(chatId, question) {
  const response = await fetch(`http://127.0.0.1:8000/api/chats/${chatId}/mensaje`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: question })
  });
  
  const data = await response.json();
  // Mostrar respuesta IA
  // Reproducir audio si exists data.audio_base64
}
```

---

## 🚀 Microservicio IA

### Endpoint: `/api/chat-documentos`
```http
POST http://127.0.0.1:8000/api/chat-documentos
Content-Type: multipart/form-data

- files: [PDF archivo(s)]
- query: pregunta del usuario
```

**Proceso interno:**
1. ✅ Recibe archivos PDF
2. ✅ Carga PDFs con PyPDFLoader
3. ✅ Divide en chunks (1000 tokens, 150 overlap)
4. ✅ Crea embeddings con GoogleGenerativeAIEmbeddings
5. ✅ Construye vectorstore con Chroma
6. ✅ Ejecuta RetrievalQA con Gemini 1.5 Flash
7. ✅ Genera audio con gTTS
8. ✅ Devuelve respuesta + audio base64

**Tecnologías:**
- LangChain: Orquestación RAG
- Chroma: Vector database
- Google Generative AI: Embeddings + LLM
- gTTS: Text-to-Speech

---

## 📱 Estado Actual del Frontend

### ✅ Implementado
- Pantalla de bienvenida
- Pantalla de chat
- Carga de archivos (simulada)
- Envío de mensajes (simulado)
- Audio con Web Speech API (no real)
- UI responsiva con Bootstrap

### ❌ Falta Conexión Real con Backend
- No llama a `/api/chats`
- No sube realmente a `/api/chats` (POST)
- No envía preguntas a `/api/chats/{id}/mensaje`
- No reproduce audio real desde `audio_base64`

---

## 🔑 Variables de Entorno Necesarias

### Backend (.env)
```env
DB_CONNECTION=sqlite
DB_DATABASE=/ruta/a/database.sqlite

# O si usas MySQL:
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=asislegal
DB_USERNAME=root
DB_PASSWORD=

FILESYSTEM_DISK=public
```

### Microservicio IA (.env)
```env
GOOGLE_API_KEY=tu_clave_aqui
```

---

## 📝 Notas Importantes

### ⚠️ Seguridad
- El `id_user` está hardcodeado a `1` en backend (TODO: usar autenticación real)
- No hay validación de pertenencia de chat (cualquiera podría acceder a cualquier chat)
- TODO: Implementar autenticación con JWT o sesiones

### ⚠️ Límites
- Máximo 10MB por PDF
- Solo archivos PDF
- Timeout de 120s para respuesta de IA

### ⚠️ Estado del Microservicio
- Si IA no responde → Error 503
- Los archivos temporales se limpian automáticamente
- Requiere conexión a Google API

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | HTML5, JS Vanilla, Bootstrap 5 | Latest |
| Backend | Laravel | 11.x |
| API | REST + JSON | - |
| Database | SQLite / MySQL | - |
| IA | FastAPI + LangChain | - |
| LLM | Google Gemini 1.5 Flash | - |
| Audio | gTTS | - |
| Embeddings | Google Generative AI | - |
| Vector DB | Chroma | - |

---

## 🎓 Próximos Pasos

1. **Conectar Frontend Realmente**
   - Implementar llamadas fetch() reales en app.js
   - Sincronizar lista de chats
   - Subir documentos correctamente
   - Reproducir audio real

2. **Seguridad**
   - Implementar autenticación (JWT/Sessions)
   - Validar propiedad de recursos
   - Rate limiting en API

3. **Mejoras UI/UX**
   - Estados de carga (spinners)
   - Manejo de errores visible
   - Historial de chats en sidebar
   - Vista previa de documentos

4. **Optimizaciones**
   - Caché en frontend
   - Paginación de mensajes
   - Lazy loading de documentos
