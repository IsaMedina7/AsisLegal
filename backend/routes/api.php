<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DocumentController;

// RUTA DE PRUEBA
Route::get('/test', function () { return ['status' => 'ok']; });

// --- RUTAS "CORE" (Antiguos Chats) ---
// Usamos 'core' para que el navegador no crea que es publicidad
Route::get('/v1', [ChatController::class, 'index']);
Route::post('/v1', [ChatController::class, 'store']);
Route::get('/v1/{id}', [ChatController::class, 'show']);
Route::post('/v1/{id}/mensaje', [ChatController::class, 'sendMessage']);

// --- B. RUTAS DE MENSAJES (La conversación) ---
// Nota: El envío de mensaje a la IA sigue estando ligado al Chat
Route::post('/chats/{id}/mensaje', [ChatController::class, 'sendMessage']);
// Pero agregamos una ruta para borrar mensajes sueltos si quisieras
Route::delete('/messages/{id}', [MessageController::class, 'destroy']);

// --- C. RUTAS DE DOCUMENTOS (Gestión de archivos) ---
Route::get('/documents', [DocumentController::class, 'index']);           // Ver mis archivos
Route::get('/documents/{id}/download', [DocumentController::class, 'download']);
Route::delete('/documents/{id}', [DocumentController::class, 'destroy']); // Borrar archivo
