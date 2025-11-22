# ⚡ GUÍA DE IMPLEMENTACIÓN - En 5 Pasos

## Objetivo
Conectar el frontend con el backend real en **menos de 5 minutos**.

---

## PASO 1: Reemplazar app.js ✅

**¿Qué hacer?**
Copiar `app_CON_BACKEND.js` al archivo `app.js`

**En PowerShell (Windows):**
```powershell
cd "c:\Users\tatan\Documentos\Talento Tech\AsisLegal\frontend"
Copy-Item app_CON_BACKEND.js app.js -Force
echo "✅ Archivo reemplazado"
```

**Verificación:**
```powershell
Get-Content app.js | Select-String "API_BASE_URL"
# Debe mostrar: const API_BASE_URL = 'http://127.0.0.1:8000/api';
```

---

## PASO 2: Iniciar Backend ✅

**Terminal 1: Backend**

```powershell
cd "c:\Users\tatan\Documentos\Talento Tech\AsisLegal\backend"
php artisan serve
```

**Esperado:**
```
Laravel development server started: http://127.0.0.1:8000
```

**Verificación:**
```powershell
# En otra terminal
Invoke-WebRequest http://127.0.0.1:8000/api/chats -Headers @{'Accept'='application/json'}
# Debe devolver JSON con estatus "success"
```

---

## PASO 3: Iniciar Microservicio IA ✅

**Terminal 2: Microservicio IA**

```powershell
cd "c:\Users\tatan\Documentos\Talento Tech\AsisLegal\microservicio_ia"

# Primero, verificar archivo .env existe con GOOGLE_API_KEY
# Si no existe:
# echo "GOOGLE_API_KEY=tu_clave_aqui" > .env

python main.py
```

**Esperado:**
```
Uvicorn running on http://127.0.0.1:8000
```

**⚠️ Conflicto de Puerto:**
Si ves: `Address already in use: ('127.0.0.1', 8000)`

Significa que Backend y IA quieren usar el mismo puerto. Cambiar uno:

```powershell
# Cambiar IA a puerto 8001
python main.py --port 8001

# IMPORTANTE: Luego actualizar en backend:
# backend/app/Http/Controllers/ChatController.php
# Línea ~62: cambiar URL de http://127.0.0.1:8000 a http://127.0.0.1:8001
```

---

## PASO 4: Servir Frontend ✅

**Terminal 3: Frontend**

```powershell
cd "c:\Users\tatan\Documentos\Talento Tech\AsisLegal\frontend"
python -m http.server 3000
```

**Esperado:**
```
Serving HTTP on 0.0.0.0 port 3000 (http://127.0.0.1:3000/) ...
```

---

## PASO 5: Probar en Navegador ✅

### 5.1: Abrir Aplicación
1. Abre navegador: `http://localhost:3000`
2. Deberías ver: Pantalla de bienvenida "AsisLegal"

### 5.2: Cargar lista de chats
Abre **Console** del navegador (F12 → Console):

```javascript
await loadChatsList()
```

**Esperado:**
- Si es primera vez: "No hay documentos. Sube uno."
- Sin errores en network

### 5.3: Crear un chat (subir PDF)

```javascript
// En console:
// 1. Crear FormData con un PDF
const formData = new FormData();

// 2. Seleccionar un PDF que tengas en tu máquina
// Opción: usar uno de ejemplo
fetch('http://127.0.0.1:8000/api/chats', {
  method: 'POST',
  body: formData  // Necesita tener pdf_file
}).then(r => r.json()).then(d => console.log(d))
```

**Mejor:** Usar interfaz:
1. Click "Crear consulta"
2. Click "Subir documentos"
3. Seleccionar un PDF
4. Click "Subir documentos"

**Esperado:**
- ✅ Mensaje: "Documento cargado"
- ✅ Chat se abre automáticamente
- ✅ PDF aparece en sidebar

### 5.4: Hacer una pregunta

En el chat abierto:
1. Escribir: "¿Cuál es el contenido principal?"
2. Presionar Enter o click "Enviar"

**Esperado:**
- ✅ Tu pregunta aparece como mensaje azul
- ✅ "🤖 IA procesando..." aparece
- ✅ Después de 5-15 seg, aparece respuesta
- ✅ Respuesta está en color gris (bot)

### 5.5: Reproducir audio

1. Click "Reproducir última respuesta"

**Esperado:**
- ✅ Audio MP3 se reproduce
- O fallback a Web Speech (español sintético)

---

## 🧪 Pruebas de Validación

### Test 1: API Conectada
```javascript
// Console del navegador
fetch('http://127.0.0.1:8000/api/chats')
  .then(r => r.json())
  .then(d => {
    if(d.status === 'success') console.log('✅ API OK');
    else console.log('❌ API Error');
  })
```

### Test 2: Subida de PDF
```bash
# PowerShell - Crear archivo de prueba
@"
Este es un documento de prueba.
Contiene información legal.
PDF de ejemplo.
"@ | Out-File test.txt

# Cambiar extensión a .pdf (o usar PDF real)
```

### Test 3: Chat Functions
```javascript
// Console - Verificar que funciones existen
console.log(typeof loadChatsList);  // 'function'
console.log(typeof openChat);        // 'function'
console.log(typeof onSend);          // 'function'
console.log(typeof playAudioFromBase64); // 'function'
```

---

## ❌ Si Algo No Funciona

### Error: "Cannot POST /api/chats"
```
✓ Verificar que Laravel está corriendo
✓ En Terminal 1 debe estar: php artisan serve
✓ URL debe ser: http://127.0.0.1:8000
```

### Error: "Connection refused 8000"
```
✓ Ambos servicios intentan usar puerto 8000
✓ Solución: cambiar uno a 8001
✓ Ver sección "Conflicto de Puerto" arriba
```

### Error: "CORS error" en Network tab
```
✓ Verificar config/cors.php en Laravel
✓ Asegurar que permite origen de frontend
✓ En desarrollo, puede ser: 'allowed_origins' => ['*']
```

### Error: "503 Service Unavailable"
```
✓ IA no está disponible
✓ Verificar que python main.py está corriendo
✓ Verificar GOOGLE_API_KEY en .env de microservicio
```

### Error: "404 Chat not found"
```
✓ El ID del chat no existe
✓ Primero: crear chat (subir PDF)
✓ Luego: usar el ID devuelto
```

---

## 📊 Verificación Final (Checklist)

```
✅ Paso 1: app.js reemplazado
✅ Paso 2: Backend corriendo (Terminal 1)
✅ Paso 3: IA corriendo (Terminal 2)
✅ Paso 4: Frontend servido (Terminal 3)
✅ Paso 5: Navegador abierto http://localhost:3000

✅ Pantalla de bienvenida carga
✅ Console sin errores
✅ API responde a GET /api/chats
✅ Puedo subir PDF
✅ Chat se abre automáticamente
✅ Puedo escribir preguntas
✅ IA responde
✅ Audio se reproduce

¡TODO FUNCIONA! 🎉
```

---

## ⏱️ Timeline Esperado

```
Minuto 0:00 - Iniciar
Minuto 0:30 - Reemplazar app.js
Minuto 1:00 - Backend corriendo
Minuto 1:30 - IA corriendo
Minuto 2:00 - Frontend servido
Minuto 2:30 - Navegador abierto
Minuto 3:00 - Verificaciones básicas
Minuto 4:00 - Subir PDF
Minuto 4:30 - Hacer pregunta
Minuto 5:00 - Reproducir audio
```

**Total: ~5 minutos**

---

## 🎯 Comandos Resumen (Copy-Paste)

**Terminal 1:**
```powershell
cd "c:\Users\tatan\Documentos\Talento Tech\AsisLegal\backend"; php artisan serve
```

**Terminal 2:**
```powershell
cd "c:\Users\tatan\Documentos\Talento Tech\AsisLegal\microservicio_ia"; python main.py
```

**Terminal 3:**
```powershell
cd "c:\Users\tatan\Documentos\Talento Tech\AsisLegal\frontend"; python -m http.server 3000
```

**Navegador:**
```
http://localhost:3000
```

---

## 🔄 Flujo de Prueba Recomendado

### 1. ✅ Pantalla de Bienvenida
- [ ] Se carga correctamente
- [ ] "AsisLegal" visible
- [ ] Botón "Crear consulta" funciona
- [ ] Console sin errores

### 2. ✅ Pantalla de Chat
- [ ] Se muestra chat + sidebar
- [ ] "Subir documentos" es clickeable
- [ ] Input de pregunta funciona
- [ ] Botones responden

### 3. ✅ Subida de PDF
- [ ] Click "Subir documentos"
- [ ] Selector de archivos abre
- [ ] Selecciono PDF
- [ ] Click "Subir"
- [ ] Mensaje de éxito aparece

### 4. ✅ Chat Cargado
- [ ] Chat se abre con documento
- [ ] Historial de mensajes carga (vacío al inicio)
- [ ] Mensaje "Inicia conversación" visible
- [ ] Input de pregunta activo

### 5. ✅ Enviar Pregunta
- [ ] Escribo pregunta
- [ ] Presiono Enter
- [ ] Pregunta aparece como usuario (azul)
- [ ] "IA procesando..." aparece
- [ ] Espero 10-15 segundos

### 6. ✅ Respuesta IA
- [ ] "IA procesando..." desaparece
- [ ] Respuesta aparece (gris)
- [ ] Respuesta es relacionada al PDF
- [ ] Sin errores HTTP

### 7. ✅ Audio
- [ ] Click "Reproducir"
- [ ] Audio MP3 se reproduce
- [ ] O Web Speech API falla y se reproduce síntesis

---

## 📞 Soporte Rápido

| Problema | Solución |
|----------|----------|
| "Cannot GET /" | Estás en puerto incorrecto. Usa http://localhost:3000 |
| "404 Not Found" | Backend no está en /api. Usa http://127.0.0.1:8000 |
| CORS error | Verificar allowed_origins en config/cors.php |
| 503 Service Unavailable | IA no responde. Verificar python main.py |
| Audio no funciona | Falta Google API Key. Verificar .env |
| PDF no sube | Selecciona PDF, no DOCX. Máximo 10MB. |

---

## 🎓 Siguientes Pasos (Después de Verificar)

Una vez que todo funciona:

1. **Explorar el código**
   - Leer `ANALISIS_PROYECTO.md`
   - Entender flujos en `DIAGRAMAS_VISUALES.md`

2. **Mejorar funcionalidades**
   - Agregar autenticación
   - Soporte para múltiples PDFs
   - Mejor UI/UX

3. **Optimizar**
   - Caché en frontend
   - Paginación
   - Rate limiting

4. **Producción**
   - Variables de entorno seguras
   - HTTPS
   - Base de datos real (no SQLite)
   - Almacenamiento en S3

---

## ✨ ¡Listo!

**Ahora tienes AsisLegal completamente funcional.**

```
Usuarios → Suben PDF → IA Lee → Responde → Audio
```

**Todos los componentes están conectados y funcionando.**

---

## 📋 Recordatorios Finales

1. **3 Terminales abiertas**
   - [ ] Terminal 1: Backend (Laravel)
   - [ ] Terminal 2: IA (FastAPI)
   - [ ] Terminal 3: Frontend (Python)

2. **3 Puertos diferentes**
   - [ ] Backend: 8000 (http://127.0.0.1:8000)
   - [ ] IA: 8000 o 8001
   - [ ] Frontend: 3000 (http://localhost:3000)

3. **app.js actualizado**
   - [ ] Reemplazado con app_CON_BACKEND.js

4. **Variables de Entorno**
   - [ ] Backend: verificar .env
   - [ ] IA: GOOGLE_API_KEY en .env

**¡Ahora estás listo para usar AsisLegal! 🚀**
