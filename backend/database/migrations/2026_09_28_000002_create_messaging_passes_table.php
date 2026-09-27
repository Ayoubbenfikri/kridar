<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 29 (monetization overhaul) — a time-boxed messaging pass (7 or 15
 * days), bought instead of paying per contact once the 5 free ones are
 * used up. While one is active, starting a new conversation costs
 * nothing at all — see MessagingCreditsService::checkAccess().
 *
 * A row is created at the moment the payment is INITIATED (before the
 * buyer has actually paid), with `starts_at`/`expires_at` both null and
 * `duration_days` already fixed — the payment round-trip through a
 * gateway can take a while, and nothing about the return URL carries
 * "which pack was this". PaymentService::handleCallback() fills the two
 * timestamps in only once the payment settles as paid.
 *
 * A row whose payment never completes just sits there with null
 * start/expiry forever — harmless: `expires_at > now()` is never true
 * against a null column, so it is never counted as active.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messaging_passes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->restrictOnDelete();

            // Nullable: a pass bought while payments are off (should never
            // happen — PaymentService refuses it) or created by a test
            // directly, with no real payment behind it.
            $table->foreignId('payment_id')->nullable()->constrained()->restrictOnDelete();

            $table->unsignedSmallInteger('duration_days');

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            $table->timestamps();

            // MessagingCreditsService::checkAccess() runs this on every
            // single new-conversation attempt, so it earns its own index
            // rather than relying on the user_id foreign key index alone.
            $table->index(['user_id', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messaging_passes');
    }
};
