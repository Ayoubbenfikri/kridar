<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 29 (monetization overhaul) — records that a specific user has
 * paid to reveal a specific owner's phone number on a specific listing.
 *
 * Independent from messaging on purpose (project spec): a user can be out
 * of free contacts and still reveal a phone number, and revealing a
 * number never touches free_contacts_remaining.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phone_reveals', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('property_id')->constrained()->restrictOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained()->restrictOnDelete();

            $table->timestamps();

            // The whole point of this table: paying twice for the same
            // number must be impossible even under a double-click or two
            // parallel requests — PaymentService checks this before ever
            // starting a new payment.
            $table->unique(['user_id', 'property_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phone_reveals');
    }
};
