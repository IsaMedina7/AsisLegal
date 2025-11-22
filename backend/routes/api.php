<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatController;

// NOTA: Las rutas en api.php automáticamente tienen el prefijo '/api'
// Ejemplo: http://127.0.0.1:8000/api/chats

// 1. Obtener todos los chats del usuario (Para tu lista en el front)
Route::get('/chats', [ChatController::class, 'index']);

// 2. Crear nuevo chat (Subir archivo)
Route::post('/chats', [ChatController::class, 'store']);

// 3. Obtener un chat específico con sus mensajes
Route::get('/chats/{id}', [ChatController::class, 'show']);

// 4. Enviar mensaje a la IA
Route::post('/chats/{id}/mensaje', [ChatController::class, 'sendMessage']);
