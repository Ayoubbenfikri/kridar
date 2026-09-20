<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Messaging (Phase 24) — one thread per interested person per listing.
 *
 * Every conversation is ABOUT a property. That is what makes this safe
 * without a moderation team: you cannot write to someone out of
 * nowhere, only about a listing they chose to publish.
 *
 * The OWNER is deliberately not a column here — it is
 * conversation.property.owner_id, derived. Storing it would create a
 * second source of truth that can drift out of sync with the property.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();

            // Restrict, like everywhere else in this schema: a property
            // with a conversation history should not vanish silently.
            $table->foreignId('property_id')->constrained()->restrictOnDelete();

            // Whoever started the thread. Always the non-owner side —
            // MessagingService refuses an owner opening a thread on
            // their own listing.
            $table->foreignId('guest_id')->constrained('users')->restrictOnDelete();

            // Denormalised so the inbox can sort by activity without
            // joining messages on every page load. Written by
            // MessagingService on each new message.
            $table->timestamp('last_message_at')->nullable();

            $table->timestamps();

            // One thread per person per listing. This is what makes
            // "send a message" a find-or-create instead of a create,
            // so two people never end up with duplicate threads about
            // the same property.
            $table->unique(['property_id', 'guest_id']);

            $table->index('last_message_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
