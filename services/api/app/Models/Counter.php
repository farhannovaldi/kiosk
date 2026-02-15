<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Counter extends Model
{
    protected $fillable = [
        'name',
        'assigned_services',
        'is_active',
    ];

    protected $casts = [
        'assigned_services' => 'array',
        'is_active' => 'boolean',
    ];
}
