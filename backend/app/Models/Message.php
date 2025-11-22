<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $primaryKey = 'id_message'; // <--- Vital
    protected $fillable = ['id_chat', 'sender', 'content'];
}
