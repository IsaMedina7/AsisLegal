<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Document;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
    // -------------------------------------------------------------------------
    // 1. LISTAR CHATS (GET /api/chats)
    // -------------------------------------------------------------------------
    public function index()
    {
        // Usamos el usuario ID 1 fijo (Modo sin login)
        $chats = Chat::where('id_user', 1)
                     ->orderBy('created_at', 'desc')
                     ->get();

        return response()->json([
            'status' => 'success',
            'data' => $chats
        ], 200);
    }

    // -------------------------------------------------------------------------
    // 2. CREAR CHAT Y SUBIR PDF (POST /api/chats)
    // -------------------------------------------------------------------------
    public function store(Request $request)
    {
        $request->validate([
            'pdf_file' => 'required|mimes:pdf|max:10240', // Max 10MB
            'titulo'   => 'nullable|string|max:255'
        ]);

        try {
            // A. Guardar el archivo físico en 'storage/app/public/documentos'
            $path = $request->file('pdf_file')->store('documentos', 'public');

            // B. Crear registro en la tabla 'documents'
            $document = Document::create([
                'nombre'    => $request->file('pdf_file')->getClientOriginalName(),
                'file_path' => $path,
                'id_user'   => 1 // Usuario fijo
            ]);

            // C. Crear registro en la tabla 'chats'
            $chat = Chat::create([
                'title'       => $request->input('titulo') ?? 'Chat: ' . $document->nombre,
                'id_document' => $document->id_document,
                'id_user'     => 1 // Usuario fijo
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Chat creado y documento subido.',
                'data'    => $chat
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al crear chat: ' . $e->getMessage()
            ], 500);
        }
    }

    // -------------------------------------------------------------------------
    // 3. VER UN CHAT Y SUS MENSAJES (GET /api/chats/{id})
    // -------------------------------------------------------------------------
    public function show($id)
    {
        // 'with' carga automáticamente los mensajes y la info del documento
        $chat = Chat::with(['messages', 'document'])->find($id);

        if (!$chat) {
            return response()->json(['status' => 'error', 'message' => 'Chat no encontrado'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $chat
        ], 200);
    }

    // -------------------------------------------------------------------------
    // 4. ENVIAR MENSAJE A LA IA (POST /api/chats/{id}/mensaje)
    // -------------------------------------------------------------------------
    public function sendMessage(Request $request, $id)
    {
        $request->validate(['content' => 'required|string']);

        // Buscar el chat y su documento
        $chat = Chat::with('document')->find($id);

        if (!$chat) {
            return response()->json(['message' => 'Chat no encontrado'], 404);
        }

        // A. Guardar el mensaje del USUARIO en MySQL
        $userMsg = Message::create([
            'id_chat' => $chat->id_chat,
            'sender'  => 'user',
            'content' => $request->input('content')
        ]);

        // B. Validar que el archivo físico existe para enviarlo a Python
        $fullPath = storage_path('app/public/' . $chat->document->file_path);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'El archivo PDF físico no existe en el servidor'], 404);
        }

        try {
<<<<<<< HEAD
            // 3. Llamada a FastAPI
            $response = Http::timeout(120)
                ->attach('files', file_get_contents($fullPath), $chat->document->nombre)
                ->post('http://127.0.0.1:8080/api/documents', [
=======
            // C. ENVIAR A FASTAPI (PYTHON)
            // Apunta al puerto 8000 donde corre uvicorn
            $response = Http::timeout(120) // Esperar hasta 2 min
                ->attach(
                    'files', // Nombre del campo en Python (main.py)
                    file_get_contents($fullPath),
                    $chat->document->nombre
                )
                ->post('http://127.0.0.1:8000/api/chat-documentos', [
>>>>>>> 73422bdb70468db7cd4a700658592faec3f8dc04
                    'query' => $request->input('content')
                ]);

            if ($response->successful()) {
                $aiData = $response->json();

                // D. Guardar respuesta de la IA en MySQL
                $aiMsg = Message::create([
                    'id_chat' => $chat->id_chat,
                    'sender'  => 'IA',
                    'content' => $aiData['respuesta'] // Texto que devolvió Gemini
                ]);

                // E. Responder al Frontend
                return response()->json([
                    'status'       => 'success',
                    'user_message' => $userMsg,
                    'ai_message'   => $aiMsg,
                    'audio_base64' => $aiData['audio'] ?? null // Audio si existe
                ], 200);

            } else {
                // Error que viene desde Python (ej: 500 en FastAPI)
                return response()->json([
                    'status'  => 'error',
                    'message' => 'La IA devolvió un error',
                    'details' => $response->body()
                ], 500);
            }

        } catch (\Exception $e) {
            // Error de conexión (ej: Python apagado)
            return response()->json([
                'status'  => 'error',
                'message' => 'No se pudo conectar con el servicio de IA (Python). ¿Está encendido en el puerto 8000?'
            ], 503);
        }
    }

    // -------------------------------------------------------------------------
    // 5. ELIMINAR CHAT (DELETE /api/chats/{id})
    // -------------------------------------------------------------------------
    public function destroy($id)
    {
        $chat = Chat::find($id);

        if (!$chat) {
            return response()->json(['message' => 'Chat no encontrado'], 404);
        }

        // Al borrar el chat, los mensajes se borran en cascada (si configuraste la FK)
        // El documento NO se borra aquí para evitar borrar archivos compartidos,
        // pero puedes descomentar la lógica en DocumentController si quieres.

        $chat->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Chat eliminado correctamente'
        ], 200);
    }
}
