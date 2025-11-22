/**
 * ============================================================================
 * AsisLegal Frontend - app.js (CORREGIDO Y FINAL)
 * ============================================================================
 */

// 1. CONFIGURACIÓN (Apunta a Laravel, no a Python)
const API_BASE_URL = 'http://127.0.0.1:8080/api'; 

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  // NO enviar Content-Type aquí para que FormData funcione automáticamente
};

// 2. ESTADO GLOBAL
const state = {
  currentChatId: null,    // ID del chat actual
  lastBotResponse: '',    // Texto para leer en voz alta
  audioBase64: null,      // Audio binario
  chats: []               // Lista para el sidebar
};

// 3. SELECTORES DEL DOM
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
// INICIALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log(`🚀 Conectando a Backend: ${API_BASE_URL}`);
  loadChatsList(); // Cargar historial al iniciar
});

// ─────────────────────────────────────────────────────────────────────────
// NAVEGACIÓN
// ─────────────────────────────────────────────────────────────────────────

// Botón "Comenzar" (Si existe en tu HTML)
startBtn?.addEventListener('click', () => {
  showChat();
  loadChatsList();
});

// Botón "Volver" (Del chat al home)
backBtn?.addEventListener('click', () => {
  showWelcome();
  state.currentChatId = null;
});

function showChat() {
  if(welcomeScreen) welcomeScreen.classList.add('d-none');
  if(chatScreen) chatScreen.classList.remove('d-none');
}

function showWelcome() {
  if(chatScreen) chatScreen.classList.add('d-none');
  if(welcomeScreen) welcomeScreen.classList.remove('d-none');
}

// ─────────────────────────────────────────────────────────────────────────
// GESTIÓN DE ARCHIVOS (UPLOAD)
// ─────────────────────────────────────────────────────────────────────────

uploadBtn?.addEventListener('click', () => fileInput.click());

fileInput?.addEventListener('change', (e) => {
  const selected = Array.from(e.target.files || []);
  if (selected.length > 0) {
    handleFileUpload(selected[0]);
  }
});

async function handleFileUpload(file) {
  // Validaciones Frontend
  if (file.type !== 'application/pdf') {
    showError('❌ Solo se aceptan archivos PDF'); 
    return; 
  }
  if (file.size > 10 * 1024 * 1024) { 
    showError('❌ El archivo es muy grande (Máx 10MB)'); 
    return; 
  }

  showLoading('Subiendo y analizando documento...');

  try {
    const formData = new FormData();
    formData.append('pdf_file', file); // Debe coincidir con Laravel ($request->file('pdf_file'))
    formData.append('titulo', file.name.replace('.pdf', '')); // Título automático

    // Petición al Backend
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
        // OJO: No poner Content-Type aquí, fetch lo pone solo para Multipart
      }
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Error al subir archivo');

    showSuccess('✅ Documento cargado exitosamente');
    
    // Actualizar la UI
    await loadChatsList();
    
    // Entrar directamente al chat creado
    if(data.data && data.data.id_chat) {
        openChat(data.data.id_chat);
    }

  } catch (error) {
    console.error(error);
    showError(`Error: ${error.message}`);
  } finally {
    hideLoading();
    fileInput.value = ''; 
  }
}

// ─────────────────────────────────────────────────────────────────────────
// HISTORIAL DE CHATS
// ─────────────────────────────────────────────────────────────────────────

async function loadChatsList() {
  try {
    const response = await fetch(`${API_BASE_URL}/chats`);
    const data = await response.json();

    if(data.status === 'success') {
      state.chats = data.data;
      renderChatsList(state.chats);
    }
  } catch (error) {
    console.error('Error cargando chats:', error);
  }
}

function renderChatsList(chats) {
  if (!filesList) return;
  filesList.innerHTML = '';

  if (chats.length === 0) {
    filesList.innerHTML = '<div class="text-muted p-2">No hay documentos subidos.</div>';
    return;
  }

  chats.forEach(chat => {
    const div = document.createElement('div');
    // Estilos Bootstrap básicos
    div.className = 'p-2 border-bottom d-flex justify-content-between align-items-center';
    div.style.cursor = 'pointer';
    div.innerHTML = `
      <div class="text-truncate" style="max-width: 200px;">
        <strong>${escapeHtml(chat.title || 'Sin título')}</strong><br>
        <small class="text-muted">${new Date(chat.created_at).toLocaleDateString()}</small>
      </div>
      <button class="btn btn-sm btn-primary">Abrir</button>
    `;
    
    // Click en todo el elemento o el botón
    div.addEventListener('click', () => openChat(chat.id_chat));
    filesList.appendChild(div);
  });
}

async function openChat(chatId) {
  showLoading('Cargando conversación...');
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`);
    const data = await response.json();

    if(data.status === 'success') {
      state.currentChatId = chatId;
      state.audioBase64 = null; // Reset audio
      
      // Renderizar mensajes antiguos
      messages.innerHTML = '';
      const chatData = data.data;
      
      // Cambiar a pantalla de chat
      showChat();

      // Título del chat en la UI (si tienes un elemento para eso)
      // document.getElementById('chat-title').innerText = chatData.title;

      if(chatData.messages && chatData.messages.length > 0) {
        chatData.messages.forEach(msg => {
          // Mapeamos 'IA' (base de datos) a 'bot' (clase CSS)
          const tipo = msg.sender === 'user' ? 'user' : 'bot';
          appendMessage(tipo, msg.content);
          
          // Guardar el último mensaje de IA para reproducir
          if(msg.sender === 'IA') state.lastBotResponse = msg.content;
        });
      } else {
        messages.innerHTML = '<div class="text-center text-muted mt-4">Inicia la conversación preguntando sobre el documento.</div>';
      }
    }
  } catch (error) {
    showError('No se pudo cargar el chat');
  } finally {
    hideLoading();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// ENVIAR MENSAJES (LÓGICA PRINCIPAL)
// ─────────────────────────────────────────────────────────────────────────

sendBtn?.addEventListener('click', onSend);
questionInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') onSend();
});

async function onSend() {
  const text = questionInput.value.trim();
  if (!text || !state.currentChatId) return;

  // 1. UI Inmediata
  appendMessage('user', text);
  questionInput.value = '';
  questionInput.disabled = true; // Evitar doble envío
  
  // 2. Loading falso (UX)
  const loadingId = 'temp-loading-' + Date.now();
  const loadingDiv = document.createElement('div');
  loadingDiv.id = loadingId;
  loadingDiv.className = 'message bot';
  loadingDiv.innerHTML = '<em>Escribiendo...</em>';
  messages.appendChild(loadingDiv);
  messages.scrollTop = messages.scrollHeight;

  try {
    // 3. Petición al Backend
    const response = await fetch(`${API_BASE_URL}/chats/${state.currentChatId}/mensaje`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ content: text })
    });

    const data = await response.json();
    
    // Quitar mensaje de "Escribiendo..."
    document.getElementById(loadingId)?.remove();

    if(data.status === 'success') {
      // 4. Mostrar respuesta real
      const aiText = data.ai_message.content;
      appendMessage('bot', aiText);
      
      state.lastBotResponse = aiText;
      state.audioBase64 = data.audio_base64 || null; // Guardar audio si viene

      // Habilitar botón de audio si hay audio
      if(playAudioBtn) playAudioBtn.disabled = !state.audioBase64;
    } else {
        appendMessage('bot', '❌ Error: La IA no pudo responder.');
    }

  } catch (error) {
    document.getElementById(loadingId)?.remove();
    appendMessage('bot', '❌ Error de conexión con el servidor.');
  } finally {
    questionInput.disabled = false;
    questionInput.focus();
  }
}

function appendMessage(kind, text) {
  const div = document.createElement('div');
  // Clases CSS asumidas: .message, .user (derecha/azul), .bot (izquierda/gris)
  div.className = `message ${kind}`; 
  // Procesar saltos de línea y seguridad
  div.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────────────
// AUDIO
// ─────────────────────────────────────────────────────────────────────────

playAudioBtn?.addEventListener('click', () => {
    if (state.audioBase64) {
        playAudioFromBase64(state.audioBase64);
    } else if (state.lastBotResponse) {
        // Fallback si no hay audio de Gemini pero hay texto
        speakText(state.lastBotResponse);
    }
});

function playAudioFromBase64(b64) {
    try {
        const audio = new Audio("data:audio/mp3;base64," + b64);
        audio.play();
    } catch (e) {
        console.error("Error reproduciendo audio", e);
        speakText(state.lastBotResponse);
    }
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = 'es-ES';
        window.speechSynthesis.speak(ut);
    } else {
        alert('Tu navegador no soporta audio.');
    }
}

// ─────────────────────────────────────────────────────────────────────────
// UTILIDADES UI
// ─────────────────────────────────────────────────────────────────────────

function escapeHtml(text) {
  if(!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showLoading(msg) {
    // Implementa tu overlay de carga aquí o usa alert simple por ahora
    // console.log("Loading...", msg);
}
function hideLoading() {
    // Ocultar overlay
}
function showError(msg) {
    alert(msg);
}
function showSuccess(msg) {
    console.log(msg);
}
