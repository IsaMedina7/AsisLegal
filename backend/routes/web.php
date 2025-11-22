<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatController;

// Route::get('/', function () {
//     return view('dashboard');
// });

Route::get('/', [ChatController::class, 'index'])->name('dashboard');

// O si prefieres entrar explícitamente por /dashboard
Route::get('/', [ChatController::class, 'index'])->name('dashboard');


// --- RUTAS FUNCIONALES DEL CHAT (Para que funcione la API) ---

// 2. Ruta para subir el PDF (El formulario del dashboard apunta aquí)
Route::post('/chat/crear', [ChatController::class, 'store'])->name('chat.store');

// 3. Ruta para ver la sala de chat
Route::get('/chat/{chat}', [ChatController::class, 'show'])->name('chat.show');

// 4. Ruta para enviar mensaje a la IA
Route::post('/chat/{chat}/mensaje', [ChatController::class, 'sendMessage'])->name('chat.message');
