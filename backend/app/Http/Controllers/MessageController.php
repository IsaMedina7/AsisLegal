<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    // Borrar un mensaje específico
    public function destroy($id)
    {
        $message = Message::find($id);

        if (!$message) {
            return response()->json(['message' => 'Mensaje no encontrado'], 404);
        }

        $message->delete();

        return response()->json(['status' => 'success', 'message' => 'Mensaje eliminado'], 200);
    }
}
