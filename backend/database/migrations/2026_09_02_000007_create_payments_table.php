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

            // Restrict: financial records must never disappear silently.
            $table->foreignId('reservation_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();

            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('MAD');
            $table->string('provider'); // App\Enums\PaymentProvider — 'cmi' is schema-only for now (Phase 8.5 wires the gateway)
            $table->string('provider_transaction_id')->nullable();
            $table->string('status')->default('pending'); // App\Enums\PaymentStatus
            $table->timestamp('paid_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
