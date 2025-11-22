alert('hello')
// Estado simple en memoria
const state = {
  files: [], // {name, type, content?}
  lastBotResponse: ''
};

// Elementos
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

// Navegación
startBtn?.addEventListener('click', () => showChat());
backBtn?.addEventListener('click', () => showWelcome());

function showChat(){
  welcomeScreen.classList.add('d-none');
  chatScreen.classList.remove('d-none');
}
function showWelcome(){
  chatScreen.classList.add('d-none');
  welcomeScreen.classList.remove('d-none');
}

// Manejo de archivos
uploadBtn?.addEventListener('click', () => fileInput.click());
fileInput?.addEventListener('change', handleFileSelect);

function handleFileSelect(e){
  const selected = Array.from(e.target.files || []);
  if(selected.length === 0) return;

  selected.forEach(file => {
    const entry = { name: file.name, type: file.type || 'unknown' };
    // Leer contenido solo para tipos de texto
    if(file.type.startsWith('text')){
      const reader = new FileReader();
      reader.onload = (ev) => {
        entry.content = ev.target.result;
        state.files.push(entry);
        renderFiles();
      };
      reader.readAsText(file);
    } else {
      // Para PDF u otros, no intentamos parsear aquí; solo registramos
      state.files.push(entry);
      renderFiles();
    }
  });
  // limpiar input para permitir subir mismos archivos otra vez
  fileInput.value = '';
}

function renderFiles(){
  filesList.innerHTML = '';
  if(state.files.length === 0){
    filesList.innerHTML = '<div class="text-muted">No hay documentos cargados.</div>';
    return;
  }
  state.files.forEach((f, idx) => {
    const div = document.createElement('div');
    div.className = 'file-item d-flex align-items-start justify-content-between';
    div.innerHTML = `<div><strong>${escapeHtml(f.name)}</strong><div class="text-muted small">${f.type || 'tipo desconocido'}</div></div><div><button class="btn btn-sm btn-outline-secondary" data-idx="${idx}">Ver</button></div>`;
    filesList.appendChild(div);
  });
  // Delegación para botones Ver
  filesList.querySelectorAll('button[data-idx]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const idx = Number(ev.currentTarget.getAttribute('data-idx'));
      const f = state.files[idx];
      if(f.content){
        // mostrar contenido en chat como mensaje del sistema
        appendMessage('bot', `Contenido de ${f.name}:\n${truncate(f.content, 1000)}`);
      } else {
        appendMessage('bot', `Archivo ${f.name} subido (previsualización no disponible).`);
      }
    });
  });
}

// Chat
sendBtn?.addEventListener('click', onSend);
questionInput?.addEventListener('keydown', (e) => { if(e.key === 'Enter') onSend(); });

function onSend(){
  const text = questionInput.value.trim();
  if(!text) return;
  appendMessage('user', text);
  questionInput.value = '';
  // Simular procesamiento y respuesta
  appendMessage('bot', 'Procesando…');
  // Simulated async reply
  setTimeout(() => {
    // quitar 'Procesando…' (último mensaje bot)
    const botPlaceholders = messages.querySelectorAll('.message.bot');
    if(botPlaceholders.length){
      const last = botPlaceholders[botPlaceholders.length-1];
      if(last.textContent.trim() === 'Procesando…') last.remove();
    }

    const names = state.files.map(f => f.name).slice(0,6);
    const docsPart = names.length ? ` He recibido ${state.files.length} documento(s): ${names.join(', ')}.` : '';
    const simulated = `Respuesta simulada sobre tu pregunta: "${text}".${docsPart} (Esta respuesta es un ejemplo; conecta con AgenteRAC para respuestas reales).`;
    appendMessage('bot', simulated);
    state.lastBotResponse = simulated;
  }, 800 + Math.random()*900);
}

function appendMessage(kind, text){
  // limpiar mensaje por seguridad
  const safe = escapeHtml(text).replace(/\n/g, '<br>');
  const div = document.createElement('div');
  div.className = 'message ' + (kind === 'user' ? 'user' : 'bot');
  div.innerHTML = safe;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Audio
playAudioBtn?.addEventListener('click', () => {
  const txt = state.lastBotResponse || 'No hay respuesta para reproducir.';
  speakText(txt);
});

function speakText(text){
  if(!('speechSynthesis' in window)){
    alert('Tu navegador no soporta síntesis de voz.');
    return;
  }
  const ut = new SpeechSynthesisUtterance(text);
  ut.lang = 'es-ES';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(ut);
}

// Utilidades
function escapeHtml(unsafe){
  return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/\"/g, "&quot;")
       .replace(/'/g, "&#039;");
}
function truncate(s, n){
  if(!s) return '';
  return s.length <= n ? s : s.slice(0,n) + '...';
}

// Inicialización: mantener referencia a elementos si script carga antes
(function init(){
  // Si el script se ejecuta y no encontró elementos (ej: cargado en head), re-obtener
  // (no necesario si el script está al final del body, pero es seguro)
})();

