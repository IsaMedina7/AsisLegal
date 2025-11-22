/**
 * ============================================================================
 * AsisLegal Frontend - app.js (VERSIÓN CON INTEGRACIÓN BACKEND)
 * ============================================================================
 * 
 * Este archivo contiene la lógica JavaScript para:
 * 1. Conectar con API REST en Laravel (Backend)
 * 2. Subir documentos (PDFs)
 * 3. Mostrar historial de chats
 * 4. Enviar preguntas a IA
 * 5. Reproducir respuestas de audio
 * 
 * API Base URL: http://127.0.0.1:8000/api
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
};

// ─────────────────────────────────────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────────────────────────────────────

const state = {
  files: [],              // {name, type, content?}
  currentChatId: null,    // ID del chat actualmente abierto
  lastBotResponse: '',    // Última respuesta del bot
  audioBase64: null,      // Audio base64 de la última respuesta
  chats: []               // Lista de chats del usuario
};

// ─────────────────────────────────────────────────────────────────────────
// SELECTORES DEL DOM
// ─────────────────────────────────────────────────────────────────────────

const welcomeScreen = document.getElementById('welcome-screen');
const chatScreen = document.getElementById('chat-screen');
const startBtn = document.getElementById('start-btn');
const backBtn = document.getElementById('back-btn');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const filesList = document.getElementById('files-list');
const sendBtn = document.getElementById('send-btn');
const questionInput = document.getElementById('question-input');
const messages = document.getElementById('messages');
const playAudioBtn = document.getElementById('play-audio');

// ─────────────────────────────────────────────────────────────────────────
// EVENTOS - NAVEGACIÓN
// ─────────────────────────────────────────────────────────────────────────

startBtn?.addEventListener('click', () => {
  showChat();
  loadChatsList();
});

backBtn?.addEventListener('click', () => {
  showWelcome();
  state.currentChatId = null;
});

function showChat() {
  welcomeScreen.classList.add('d-none');
  chatScreen.classList.remove('d-none');
}

function showWelcome() {
  chatScreen.classList.add('d-none');
  welcomeScreen.classList.remove('d-none');
}

// ─────────────────────────────────────────────────────────────────────────
// EVENTOS - GESTIÓN DE ARCHIVOS
// ─────────────────────────────────────────────────────────────────────────

uploadBtn?.addEventListener('click', () => {
  fileInput.click();
});

fileInput?.addEventListener('change', (e) => {
  const selected = Array.from(e.target.files || []);
  if (selected.length > 0) {
    handleFileUpload(selected[0]); // Tomar primer archivo
  }
});

/**
 * Sube un documento PDF a través de la API
 * POST /api/chats
 */
async function handleFileUpload(file) {
  // Validación
  if (file.type !== 'application/pdf') {
    showError('❌ Solo se aceptan archivos PDF');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showError('❌ El archivo no debe superar 10MB');
    return;
  }

  showLoading('⏳ Subiendo documento...');

  try {
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('titulo', `Chat: ${file.name}`);

    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      body: formData
      // NO incluir Content-Type, el navegador lo hace automáticamente
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.errors || `Error HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    if (data.status === 'success') {
      showSuccess(`✅ Documento "${file.name}" cargado correctamente`);

      // Abrir el chat creado
      await openChat(data.data.id_chat);

      // Recargar lista de chats
      await loadChatsList();
    }
  } catch (error) {
    console.error('Error al subir documento:', error);
    showError(`❌ Error: ${error.message}`);
  } finally {
    hideLoading();
    fileInput.value = ''; // Limpiar input
  }
}

// ─────────────────────────────────────────────────────────────────────────
// GESTIÓN DE CHATS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Carga la lista de chats del usuario
 * GET /api/chats
 */
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
      state.chats = data.data || [];
      renderChatsList(state.chats);
    }
  } catch (error) {
    console.error('Error al cargar chats:', error);
    showError('⚠️ No se pudieron cargar los chats');
  }
}

/**
 * Renderiza la lista de chats en el sidebar
 */
function renderChatsList(chats) {
  filesList.innerHTML = '';

  if (chats.length === 0) {
    filesList.innerHTML = '<div class="text-muted">📂 No hay documentos. Sube uno.</div>';
    return;
  }

  chats.forEach((chat) => {
    const div = document.createElement('div');
    div.className = 'file-item d-flex align-items-start justify-content-between mb-2';

    const fecha = new Date(chat.created_at).toLocaleDateString('es-ES');
    const titulo = escapeHtml(chat.title);

    div.innerHTML = `
      <div>
        <strong>${titulo}</strong>
        <div class="text-muted small">${fecha}</div>
      </div>
      <button class="btn btn-sm btn-outline-secondary" data-chat-id="${chat.id_chat}">
        📖
      </button>
    `;

    filesList.appendChild(div);
  });

  // Delegación: escuchar clics en botones
  filesList.querySelectorAll('button[data-chat-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const chatId = Number(e.currentTarget.getAttribute('data-chat-id'));
      openChat(chatId);
    });
  });
}

/**
 * Abre un chat y carga su historial
 * GET /api/chats/{id}
 */
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
      const chat = data.data;
      state.currentChatId = chatId;
      state.audioBase64 = null;
      state.lastBotResponse = '';

      // Actualizar header
      const header = document.querySelector('.card-header h5');
      const subheader = document.querySelector('.card-header small');
      if (header) header.textContent = chat.title;
      if (subheader) subheader.textContent = chat.document?.nombre || 'Documento';

      // Cargar mensajes
      messages.innerHTML = '';

      if (chat.messages && chat.messages.length > 0) {
        chat.messages.forEach((msg) => {
          appendMessage(
            msg.sender === 'user' ? 'user' : 'bot',
            msg.content
          );
        });
        // Guardar última respuesta del bot para audio
        const lastBotMsg = [...chat.messages].reverse().find(m => m.sender === 'IA');
        if (lastBotMsg) state.lastBotResponse = lastBotMsg.content;
      } else {
        messages.innerHTML = '<div class="text-center text-muted mt-3">💬 Inicia una conversación</div>';
      }

      // Mostrar pantalla de chat
      showChat();
    }
  } catch (error) {
    console.error('Error al abrir chat:', error);
    showError('⚠️ No se pudo abrir el chat');
  }
}

// ─────────────────────────────────────────────────────────────────────────
// ENVÍO DE MENSAJES
// ─────────────────────────────────────────────────────────────────────────

sendBtn?.addEventListener('click', onSend);
questionInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    onSend();
  }
});

/**
 * Envía un mensaje a la IA
 * POST /api/chats/{id}/mensaje
 */
async function onSend() {
  const text = questionInput.value.trim();

  if (!text) return;

  if (!state.currentChatId) {
    showError('⚠️ No hay chat abierto');
    return;
  }

  // Mostrar mensaje del usuario
  appendMessage('user', text);
  questionInput.value = '';

  // Mostrar indicador de procesamiento
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message bot';
  loadingDiv.innerHTML = '<em>🤖 IA procesando...</em>';
  messages.appendChild(loadingDiv);
  messages.scrollTop = messages.scrollHeight;

  // Desabilitar input mientras se procesa
  questionInput.disabled = true;
  sendBtn.disabled = true;

  try {
    const response = await fetch(
      `${API_BASE_URL}/chats/${state.currentChatId}/mensaje`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ content: text })
      }
    );

    // Remover indicador de carga
    loadingDiv.remove();

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || `Error HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    if (data.status === 'success') {
      // Mostrar respuesta de IA
      const aiResponse = data.ai_message.content;
      appendMessage('bot', aiResponse);
      state.lastBotResponse = aiResponse;

      // Guardar audio si está disponible
      if (data.audio_base64) {
        state.audioBase64 = data.audio_base64;
        playAudioBtn.disabled = false;
      } else {
        playAudioBtn.disabled = true;
      }
    }
  } catch (error) {
    // Remover indicador de carga
    loadingDiv.remove();
    console.error('Error al enviar mensaje:', error);
    appendMessage('bot', `❌ Error: ${error.message}`);
  } finally {
    // Rehabilitar input
    questionInput.disabled = false;
    sendBtn.disabled = false;
    questionInput.focus();
  }
}

/**
 * Añade un mensaje a la UI
 */
function appendMessage(kind, text) {
  const safe = escapeHtml(text).replace(/\n/g, '<br>');
  const div = document.createElement('div');
  div.className = 'message ' + (kind === 'user' ? 'user' : 'bot');
  div.innerHTML = safe;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────────────
// REPRODUCCIÓN DE AUDIO
// ─────────────────────────────────────────────────────────────────────────

playAudioBtn?.addEventListener('click', () => {
  if (state.audioBase64) {
    playAudioFromBase64(state.audioBase64);
  } else if (state.lastBotResponse) {
    // Fallback: usar Web Speech API
    speakText(state.lastBotResponse);
  } else {
    showError('❌ No hay audio para reproducir');
  }
});

/**
 * Reproduce audio desde string base64
 */
function playAudioFromBase64(base64String) {
  try {
    const audioBlob = base64ToBlob(base64String);
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio();
    audio.src = audioUrl;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      showSuccess('✅ Audio finalizado');
    };

    audio.onerror = (error) => {
      console.error('Error reproduciendo audio:', error);
      // Fallback
      speakText(state.lastBotResponse);
    };

    audio.play().catch((err) => {
      console.error('Error al reproducir:', err);
      speakText(state.lastBotResponse);
    });
  } catch (error) {
    console.error('Error con audio base64:', error);
    speakText(state.lastBotResponse);
  }
}

/**
 * Convierte base64 a Blob
 */
function base64ToBlob(base64String) {
  const byteCharacters = atob(base64String);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'audio/mp3' });
}

/**
 * Fallback: usa Web Speech API para síntesis de voz
 */
function speakText(text) {
  if (!('speechSynthesis' in window)) {
    showError('❌ Tu navegador no soporta síntesis de voz');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  showSuccess('🔊 Reproduciendo...');
}

// ─────────────────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES
// ─────────────────────────────────────────────────────────────────────────

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Trunca un string a N caracteres
 */
function truncate(s, n) {
  if (!s) return '';
  return s.length <= n ? s : s.slice(0, n) + '...';
}

/**
 * Muestra mensaje de error
 */
function showError(message) {
  const alertContainer = document.querySelector('.container');
  const alert = document.createElement('div');
  alert.className = 'alert alert-danger alert-dismissible fade show mt-3';
  alert.setAttribute('role', 'alert');
  alert.innerHTML = `
    ${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  alertContainer.insertBefore(alert, alertContainer.firstChild);

  // Auto-cerrar después de 5 segundos
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

/**
 * Muestra mensaje de éxito
 */
function showSuccess(message) {
  const alertContainer = document.querySelector('.container');
  const alert = document.createElement('div');
  alert.className = 'alert alert-success alert-dismissible fade show mt-3';
  alert.setAttribute('role', 'alert');
  alert.innerHTML = `
    ${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  alertContainer.insertBefore(alert, alertContainer.firstChild);

  // Auto-cerrar después de 3 segundos
  setTimeout(() => {
    alert.remove();
  }, 3000);
}

/**
 * Muestra indicador de carga
 */
function showLoading(message) {
  const alertContainer = document.querySelector('.container');
  const alert = document.createElement('div');
  alert.className = 'alert alert-info mt-3';
  alert.setAttribute('role', 'status');
  alert.id = 'loading-alert';
  alert.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2"></span>
    ${escapeHtml(message)}
  `;
  alertContainer.insertBefore(alert, alertContainer.firstChild);
}

/**
 * Oculta indicador de carga
 */
function hideLoading() {
  const loadingAlert = document.getElementById('loading-alert');
  if (loadingAlert) {
    loadingAlert.remove();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// INICIALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────

// Cargar chats cuando se abre la pantalla de chat
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 AsisLegal cargado');
  console.log(`📡 API Base: ${API_BASE_URL}`);
});
