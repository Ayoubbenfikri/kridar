<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();

            // Cascade here, unlike the rest of the schema: a message has
            // no meaning without its thread, so orphans would be pure
            // noise. Reservations and payments are the opposite — those
            // must survive.
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();

            $table->foreignId('sender_id')->constrained('users')->restrictOnDelete();

            $table->text('body');

            // Per message, not per conversation: "unread" is always
            // relative to who is looking, and a per-conversation flag
            // could not express "read the first three, not the rest".
            $table->timestamp('read_at')->nullable();

            $table->timestamps();

            // The thread view reads one conversation in date order, and
            // the unread count filters on sender + read_at.
            $table->index(['conversation_id', 'created_at']);
            $table->index(['conversation_id', 'sender_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
