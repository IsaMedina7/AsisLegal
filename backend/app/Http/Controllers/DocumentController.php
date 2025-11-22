<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
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
        $request->validate([
            'pdf_file' => 'required|mimes:pdf|max:10240',
            'titulo' => 'nullable|string|max:255'
        ]);

        // 1. Guardar archivo
        $path = $request->file('pdf_file')->store('documentos', 'public');

        // 2. Crear Documento (AQUÍ ESTABA EL PRIMER ERROR)
        $document = Document::create([
            'nombre' => $request->file('pdf_file')->getClientOriginalName(),
            'file_path' => $path,
            'id_user' => 1 // <--- CAMBIO: Antes tenías Auth::id()
        ]);

        $document->save();
    }

    /**
     * Display the specified resource.
     */
    public function show(Document $document)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Document $document)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Document $document)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Document $document)
    {
        //
    }
}
