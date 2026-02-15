<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Visitor extends Model
{
    protected $fillable = [
        'nik',
        'name',
        'qr_code_string',
    ];

    public function queues(): HasMany
    {
        return $this->hasMany(Queue::class);
    }
}
