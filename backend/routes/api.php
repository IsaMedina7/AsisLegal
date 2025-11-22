<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\MessageController; // <--- Nuevo

// --- A. RUTAS DE CHATS (El núcleo) ---
Route::get('/chats', [ChatController::class, 'index']);           // Listar chats
Route::post('/chats', [ChatController::class, 'store']);          // Crear chat (Subir PDF)
Route::get('/chats/{id}', [ChatController::class, 'show']);       // Ver chat (trae mensajes)
Route::delete('/chats/{id}', [ChatController::class, 'destroy']); // Borrar chat completo

// --- B. RUTAS DE MENSAJES (La conversación) ---
// Nota: El envío de mensaje a la IA sigue estando ligado al Chat
Route::post('/chats/{id}/mensaje', [ChatController::class, 'sendMessage']);
// Pero agregamos una ruta para borrar mensajes sueltos si quisieras
Route::delete('/messages/{id}', [MessageController::class, 'destroy']);

// --- C. RUTAS DE DOCUMENTOS (Gestión de archivos) ---
Route::get('/documents', [DocumentController::class, 'index']);           // Ver mis archivos
Route::get('/documents/{id}/download', [DocumentController::class, 'download']); // Descargar
Route::delete('/documents/{id}', [DocumentController::class, 'destroy']); // Borrar archivo
