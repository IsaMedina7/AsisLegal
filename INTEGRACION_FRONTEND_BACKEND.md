# Guía de Integración Frontend ↔ Backend

## 🔌 Conexión entre app.js y API REST

### Configuración Base
```javascript
// Backend base URL
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Headers por defecto
const DEFAULT_HEADERS = {
  'Accept': 'application/json',
};
```

---

## 📡 Endpoint 1: GET `/api/chats` - Obtener lista de chats

**¿Cuándo se usa?**
- Al iniciar la aplicación
- Al volver a la pantalla de bienvenida
- Para actualizar la lista de conversaciones

**Implementación en Frontend:**
```javascript
async function loadChatsList() {
  try {
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'GET',
      headers: DEFAULT_HEADERS
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      // data.data es array de chats
      console.log('Chats cargados:', data.data);
      renderChatsList(data.data); // Tu función para renderizar
      return data.data;
    }
  } catch (error) {
    console.error('Error al cargar chats:', error);
    showError('No se pudieron cargar los chats');
  }
}

function renderChatsList(chats) {
  // Renderizar lista de chats en el sidebar
  const chatsList = document.getElementById('files-list');
  chatsList.innerHTML = '';
  
  if (chats.length === 0) {
    chatsList.innerHTML = '<div class="text-muted">No hay chats. Crea uno.</div>';
    return;
  }

  chats.forEach(chat => {
    const div = document.createElement('div');
    div.className = 'file-item d-flex align-items-start justify-content-between';
    div.innerHTML = `
      <div>
        <strong>${escapeHtml(chat.title)}</strong>
        <div class="text-muted small">${new Date(chat.created_at).toLocaleDateString('es-ES')}</div>
      </div>
      <button class="btn btn-sm btn-outline-secondary" data-chat-id="${chat.id_chat}">Abrir</button>
    `;
    chatsList.appendChild(div);
  });

  // Delegación: escuchar clics en botones "Abrir"
  chatsList.querySelectorAll('button[data-chat-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const chatId = Number(e.currentTarget.getAttribute('data-chat-id'));
      openChat(chatId);
    });
  });
}
```

---

## 📤 Endpoint 2: POST `/api/chats` - Subir documento (crear chat)

**¿Cuándo se usa?**
- Usuario selecciona archivo PDF y hace click en "Subir"
- Crea un nuevo chat asociado al documento

**Implementación en Frontend:**
```javascript
// Reemplazar la función existente
async function handleFileUpload(files) {
  if (files.length === 0) return;

  const file = files[0]; // Tomar el primer archivo

  // Validar que sea PDF
  if (file.type !== 'application/pdf') {
    showError('Solo se aceptan archivos PDF');
    return;
  }

  // Validar tamaño (máx 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showError('El archivo no debe superar 10MB');
    return;
  }

  showLoading('Subiendo documento...');

  try {
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('titulo', `Chat: ${file.name}`);

    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      body: formData // ⚠️ NO incluir Content-Type, el navegador lo hace
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    if (data.status === 'success') {
      console.log('Chat creado:', data.data);
      showSuccess(`Documento "${file.name}" cargado`);
      
      // Abrir el chat creado
      await openChat(data.data.id_chat);
      
      // Recargar lista de chats
      await loadChatsList();
    }
  } catch (error) {
    console.error('Error al subir documento:', error);
    showError(`Error: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Modificar el evento de upload
uploadBtn?.addEventListener('click', () => {
  const files = fileInput.files;
  if (files.length === 0) {
    fileInput.click(); // Abrir selector
  } else {
    handleFileUpload(Array.from(files));
  }
});
```

**Respuesta esperada:**
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

---

## 💬 Endpoint 3: GET `/api/chats/{id}` - Cargar chat con mensajes

**¿Cuándo se usa?**
- Cuando usuario hace click en un chat existente
- Para mostrar el historial de conversación

**Implementación en Frontend:**
```javascript
let currentChatId = null; // Variable global para rastrear chat actual

async function openChat(chatId) {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'GET',
      headers: DEFAULT_HEADERS
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'success') {
      currentChatId = chatId;
      const chat = data.data;

      // Actualizar UI
      document.querySelector('.card-header h5').textContent = chat.title;
      document.querySelector('.card-header small').textContent = chat.document.nombre;

      // Limpiar y cargar mensajes
      messages.innerHTML = '';
      if (chat.messages && chat.messages.length > 0) {
        chat.messages.forEach(msg => {
          appendMessage(msg.sender === 'user' ? 'user' : 'bot', msg.content);
        });
      } else {
        messages.innerHTML = '<div class="text-center text-muted mt-3">Inicia una conversación.</div>';
      }

      // Mostrar pantalla de chat
      showChat();
    }
  } catch (error) {
    console.error('Error al abrir chat:', error);
    showError('No se pudo abrir el chat');
  }
}
```

**Respuesta esperada:**
```json
{
  "status": "success",
  "data": {
    "id_chat": 1,
    "title": "Chat: contrato.pdf",
    "document": {
      "nombre": "contrato.pdf",
      "file_path": "documentos/contrato.pdf"
    },
    "messages": [
      {
        "id_message": 1,
        "sender": "user",
        "content": "¿Términos principales?"
      },
      {
        "id_message": 2,
        "sender": "IA",
        "content": "Los términos principales son..."
      }
    ]
  }
}
```

---

## 🤖 Endpoint 4: POST `/api/chats/{id}/mensaje` - Enviar pregunta a IA

**¿Cuándo se usa?**
- Usuario escribe pregunta y hace click en "Enviar"
- Obtiene respuesta de la IA + audio

**Implementación en Frontend:**
```javascript
// Reemplazar la función onSend existente
async function onSend() {
  const text = questionInput.value.trim();
  if (!text) return;

  if (!currentChatId) {
    showError('No hay chat abierto');
    return;
  }

  // Mostrar mensaje del usuario inmediatamente
  appendMessage('user', text);
  questionInput.value = '';

  // Mostrar indicador de carga
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message bot';
  loadingDiv.innerHTML = '<em>IA está procesando...</em>';
  messages.appendChild(loadingDiv);
  messages.scrollTop = messages.scrollHeight;

  try {
    const response = await fetch(`${API_BASE_URL}/chats/${currentChatId}/mensaje`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ content: text })
    });

    // Remover mensaje de carga
    loadingDiv.remove();

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    if (data.status === 'success') {
      // Mostrar respuesta de IA
      const aiResponse = data.ai_message.content;
      appendMessage('bot', aiResponse);
      state.lastBotResponse = aiResponse;

      // Si hay audio, guardarlo para reproducir
      if (data.audio_base64) {
        state.audioBase64 = data.audio_base64;
        playAudioBtn.disabled = false;
      }
    }
  } catch (error) {
    // Remover mensaje de carga
    loadingDiv.remove();
    console.error('Error al enviar mensaje:', error);
    appendMessage('bot', `❌ Error: ${error.message}`);
  }
}

// Actualizar estado global
const state = {
  files: [],
  lastBotResponse: '',
  audioBase64: null,
  currentChatId: null
};
```

**Reproducir Audio (Mejorado):**
```javascript
playAudioBtn?.addEventListener('click', () => {
  if (state.audioBase64) {
    playAudioFromBase64(state.audioBase64);
  } else if (state.lastBotResponse) {
    speakText(state.lastBotResponse);
  } else {
    showError('No hay audio para reproducir');
  }
});

function playAudioFromBase64(base64String) {
  try {
    const audioBlob = base64ToBlob(base64String);
    const audioUrl = URL.createObjectURL(audioBlob);
    
    const audio = new Audio();
    audio.src = audioUrl;
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
    audio.play().catch(err => {
      console.error('Error reproduciendo audio:', err);
      speakText(state.lastBotResponse); // Fallback
    });
  } catch (error) {
    console.error('Error con audio base64:', error);
    speakText(state.lastBotResponse); // Fallback
  }
}

function base64ToBlob(base64String) {
  const byteCharacters = atob(base64String);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'audio/mp3' });
}
```

**Respuesta esperada:**
```json
{
  "status": "success",
  "user_message": {
    "id_message": 3,
    "sender": "user",
    "content": "¿Obligaciones?"
  },
  "ai_message": {
    "id_message": 4,
    "sender": "IA",
    "content": "Según el documento, las obligaciones son..."
  },
  "audio_base64": "//NExAASDZs0AQCF7I6P..."
}
```

---

## 🎯 Flujo Completo: Usuario sube documento y pregunta

```
1. Usuario en pantalla de bienvenida
   ↓
2. Click "Crear consulta"
   ↓
3. Se muestra chat + sidebar
   ↓
4. Usuario selecciona PDF en sidebar
   ↓
5. Click "Subir documentos"
   ↓
6. [POST /api/chats] → Crea chat + documento
   ↓
7. Chat se abre automáticamente
   ↓
8. [GET /api/chats/{id}] → Carga mensajes vacíos
   ↓
9. Usuario escribe pregunta y presiona Enter
   ↓
10. [POST /api/chats/{id}/mensaje] → Procesa en IA
    ↓
11. IA responde + audio generado
    ↓
12. Respuesta aparece en chat
    ↓
13. Usuario puede reproducir audio
```

---

## ⚙️ Funciones Auxiliares Necesarias

```javascript
// Mostrar mensajes de error
function showError(message) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-danger alert-dismissible fade show';
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.querySelector('.container').insertBefore(alert, document.querySelector('.py-5'));
}

// Mostrar mensajes de éxito
function showSuccess(message) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-success alert-dismissible fade show';
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.querySelector('.container').insertBefore(alert, document.querySelector('.py-5'));
  setTimeout(() => alert.remove(), 3000);
}

// Indicador de carga
function showLoading(message) {
  // Implementar spinner si lo deseas
  console.log('Loading:', message);
}

function hideLoading() {
  // Remover spinner
  console.log('Loading done');
}
```

---

## 🔒 Manejo de Errores HTTP

| Código | Significado | Acción |
|--------|-----------|--------|
| 200 | OK | Procesar respuesta normalmente |
| 201 | Created | Chat creado exitosamente |
| 404 | Not Found | Chat o documento no existe |
| 422 | Unprocessable Entity | Validación fallida (PDF inválido, etc.) |
| 500 | Server Error | Error interno del backend |
| 503 | Service Unavailable | IA no disponible |

```javascript
if (response.status === 422) {
  // Validación fallida
  showError('El archivo no cumple requisitos');
} else if (response.status === 503) {
  // IA no disponible
  showError('Servicio de IA no disponible');
} else if (!response.ok) {
  // Error genérico
  showError(`Error HTTP ${response.status}`);
}
```

---

## 🧪 Prueba Local

### 1. Verificar que Laravel está corriendo
```bash
cd backend
php artisan serve
```
Debe escuchar en `http://127.0.0.1:8000`

### 2. Verificar que FastAPI está corriendo
```bash
cd microservicio_ia
python main.py
```
Debe escuchar en `http://127.0.0.1:8000`

### 3. Abrir frontend
```bash
cd frontend
# Servir con cualquier servidor HTTP
python -m http.server 3000
```
Acceder a `http://localhost:3000`

### 4. Pruebas en Console del Navegador
```javascript
// Cargar chats
await loadChatsList();

// Crear chat (necesita FormData real)
const formData = new FormData();
formData.append('pdf_file', /* archivo PDF */);
formData.append('titulo', 'Test');
await fetch('http://127.0.0.1:8000/api/chats', {
  method: 'POST',
  body: formData
});

// Enviar mensaje
await fetch('http://127.0.0.1:8000/api/chats/1/mensaje', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({content: '¿Cuáles son los términos?'})
});
```

---

## ⚠️ Consideraciones CORS

Si el frontend está en diferente puerto que el backend, pueden haber problemas CORS.

**Verificar en Laravel** (`config/cors.php`):
```php
'allowed_origins' => [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:*',
],
```

O agregar headers en el middleware:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
```
