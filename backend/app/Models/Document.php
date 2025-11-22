<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $primaryKey = 'id_document'; // <--- Vital
    protected $fillable = ['nombre', 'file_path', 'id_user'];
}
