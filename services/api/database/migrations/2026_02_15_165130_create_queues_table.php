<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('queues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->date('queue_date');
            $table->unsignedInteger('ticket_number');
            $table->string('ticket_code', 16);
            $table->enum('status', ['waiting', 'called', 'serving', 'skipped', 'completed'])
                ->default('waiting');
            $table->unsignedTinyInteger('recall_count')->default(0);
            $table->timestamp('called_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('skipped_at')->nullable();
            $table->timestamps();

            $table->unique(['service_id', 'queue_date', 'ticket_number']);
            $table->index(['status', 'queue_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queues');
    }
};
