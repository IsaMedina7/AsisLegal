<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    // 1. LISTAR DOCUMENTOS (GET /api/documents)
    public function index()
    {
        // Hardcode usuario 1 (Modo Pruebas)
        $documents = Document::where('id_user', 1)
                             ->orderBy('created_at', 'desc')
                             ->get();

        return response()->json([
            'status' => 'success',
            'data' => $documents
        ], 200);
    }

    // 2. DESCARGAR PDF (GET /api/documents/{id}/download)
    public function download($id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json(['message' => 'Documento no encontrado'], 404);
        }

        // Verificar si el archivo físico existe
        if (!Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => 'El archivo físico fue borrado del servidor'], 404);
        }

        // Forzar la descarga del archivo
        return Storage::disk('public')->download($document->file_path, $document->nombre);
    }

    // 3. BORRAR DOCUMENTO (DELETE /api/documents/{id})
    public function destroy($id)
    {
        $document = Document::find($id);

        if (!$document) {
            return response()->json(['message' => 'Documento no encontrado'], 404);
        }

        // 1. Borrar archivo físico
        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        // 2. Borrar registro de BD (Esto borrará los chats asociados por la FK cascade)
        $document->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Documento y chats asociados eliminados correctamente'
        ], 200);
    }
}
