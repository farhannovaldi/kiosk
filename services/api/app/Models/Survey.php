<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Survey extends Model
{
    protected $fillable = [
        'rating',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];
}
