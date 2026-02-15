<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Queue extends Model
{
    protected $fillable = [
        'service_id',
        'queue_date',
        'ticket_number',
        'ticket_code',
        'status',
        'recall_count',
        'called_at',
        'started_at',
        'completed_at',
        'skipped_at',
    ];

    protected $casts = [
        'queue_date' => 'date',
        'recall_count' => 'integer',
        'called_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'skipped_at' => 'datetime',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
