<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // 1. Buscamos los chats del usuario 1 (Hardcodeado para pruebas)
        $chats = \App\Models\Chat::where('id_user', 1)->orderBy('created_at', 'desc')->get();

        // 2. Enviamos la variable $chats a la vista usando compact()
        return view('dashboard', compact('chats'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $chat = new Chat();
        $chat->id_user = $request->input('id_user');
        $chat->title = $request->input('title');
        $chat->save();
        $request->session()->flash('status', 'Chat creado correctamente!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Chat $chat)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Chat $chat)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Chat $chat)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Chat $chat)
    {
        //
    }
}
