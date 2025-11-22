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
    // GET /api/chats
    public function index()
    {
        // Devolvemos JSON directamente
        $chats = Chat::where('id_user', 1)
                     ->orderBy('created_at', 'desc')
                     ->get();

        return response()->json([
            'status' => 'success',
            'data' => $chats
        ], 200);
    }

    // POST /api/chats
    public function store(Request $request)
    {
        // Validación (Si falla, Laravel devuelve JSON 422 automáticamente)
        $request->validate([
            'pdf_file' => 'required|mimes:pdf|max:10240',
            'titulo' => 'nullable|string'
        ]);

        try {
            // 1. Guardar archivo
            $path = $request->file('pdf_file')->store('documentos', 'public');

            // 2. Crear Documento
            $document = Document::create([
                'nombre' => $request->file('pdf_file')->getClientOriginalName(),
                'file_path' => $path,
                'id_user' => 1 // ID Fijo
            ]);

            // 3. Crear Chat
            $chat = Chat::create([
                'title' => $request->input('titulo') ?? 'Chat: ' . $document->nombre,
                'id_document' => $document->id_document,
                'id_user' => 1
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Chat creado correctamente',
                'data' => $chat
            ], 201); // 201 = Created

        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // GET /api/chats/{id}
    public function show($id)
    {
        // Buscamos el chat por ID
        $chat = Chat::with(['messages', 'document'])->find($id);

        if (!$chat) {
            return response()->json(['status' => 'error', 'message' => 'Chat no encontrado'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $chat
        ], 200);
    }

    // POST /api/chats/{id}/mensaje
    public function sendMessage(Request $request, $id)
    {
        $request->validate(['content' => 'required|string']);

        $chat = Chat::with('document')->find($id);

        if (!$chat) {
            return response()->json(['message' => 'Chat no encontrado'], 404);
        }

        // 1. Guardar mensaje del usuario
        $userMsg = Message::create([
            'id_chat' => $chat->id_chat,
            'sender' => 'user',
            'content' => $request->input('content')
        ]);

        // 2. Preparar envío a Python
        $fullPath = storage_path('app/public/' . $chat->document->file_path);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'El archivo PDF no existe en el servidor'], 404);
        }

        try {
            // 3. Llamada a FastAPI
            $response = Http::timeout(120)
                ->attach('files', file_get_contents($fullPath), $chat->document->nombre)
                ->post('http://127.0.0.1:8080/api/documents', [
                    'query' => $request->input('content')
                ]);

            if ($response->successful()) {
                $aiData = $response->json();

                // 4. Guardar respuesta IA
                $aiMsg = Message::create([
                    'id_chat' => $chat->id_chat,
                    'sender' => 'IA',
                    'content' => $aiData['respuesta']
                ]);

                return response()->json([
                    'status' => 'success',
                    'user_message' => $userMsg,
                    'ai_message' => $aiMsg,
                    'audio_base64' => $aiData['audio'] ?? null
                ], 200);

            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error en la IA',
                    'details' => $response->body()
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'No hay conexión con el servicio de IA'
            ], 503); // 503 = Service Unavailable
        }
    }
}
