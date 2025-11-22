<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    protected $primaryKey = 'id_chat'; // <--- Vital
    protected $fillable = ['title', 'id_document', 'id_user'];

    // Relaciones
    public function document() {
        return $this->belongsTo(Document::class, 'id_document', 'id_document');
    }
    public function messages() {
        return $this->hasMany(Message::class, 'id_chat', 'id_chat');
    }
}
