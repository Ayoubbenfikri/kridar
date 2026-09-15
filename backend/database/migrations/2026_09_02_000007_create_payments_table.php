<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            // ---- Phase 22 (pricing): one table, two kinds of payment --
            // Kridar now charges money in two unrelated situations:
            //   - 'reservation'         — a guest paying for a booking
            //   - 'listing_publication' — an owner paying the one-off
            //                             fee to publish a long-term ad
            //
            // Both go through the SAME gateway architecture
            // (PaymentGatewayInterface / PaymentService), so they share
            // this table rather than duplicating it. EXACTLY ONE of
            // reservation_id / property_id is set, decided by `type` —
            // enforced in PaymentService, not by the schema, since SQLite
            // has no cross-column check constraints we can rely on.
            $table->string('type')->default('reservation'); // App\Enums\PaymentType

            // Restrict: financial records must never disappear silently.
            $table->foreignId('reservation_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('property_id')->nullable()->constrained()->restrictOnDelete();

            // Who paid: the guest (reservation) or the owner (publication).
            $table->foreignId('user_id')->constrained()->restrictOnDelete();

            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('MAD');
            $table->string('provider'); // App\Enums\PaymentProvider — 'cmi' is schema-only for now (Phase 8.5 wires the gateway)
            $table->string('provider_transaction_id')->nullable();
            $table->string('status')->default('pending'); // App\Enums\PaymentStatus
            $table->timestamp('paid_at')->nullable();

            $table->timestamps();

            // The admin revenue screens filter on these two together
            // ("paid publication fees", "paid booking payments").
            $table->index(['type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
