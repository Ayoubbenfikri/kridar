<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();

            // Restrict: a property or a guest with existing bookings can't
            // just be hard-deleted out from under the booking history.
            $table->foreignId('property_id')->constrained()->restrictOnDelete();
            $table->foreignId('guest_id')->constrained('users')->restrictOnDelete();

            $table->string('rental_type'); // App\Enums\RentalType — only ShortTerm or LongTerm here
            $table->date('start_date');
            $table->date('end_date');

            // Snapshotted at booking time so a later price change by the
            // owner never retroactively changes an existing reservation.
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);

            // ---- Phase 22 (pricing): Kridar's commission ------------
            // Snapshotted for the same reason as the prices above: the
            // admin can change the rate at any time, and that must not
            // rewrite what was already agreed on past bookings.
            //
            // total_price is what the guest pays. owner_amount is what
            // the owner receives. commission_amount is Kridar's cut:
            //     commission_amount = total_price * commission_rate / 100
            //     owner_amount      = total_price - commission_amount
            //
            // All three stay 0 for a LONG-TERM reservation — Kridar
            // takes nothing from rent, only the publication fee.
            $table->decimal('commission_rate', 5, 2)->default(0);   // percent, e.g. 10.00
            $table->decimal('commission_amount', 10, 2)->default(0);
            $table->decimal('owner_amount', 10, 2)->default(0);

            $table->unsignedSmallInteger('guests_count')->nullable();

            $table->string('status')->default('pending'); // App\Enums\ReservationStatus
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamps();

            $table->index(['property_id', 'start_date', 'end_date']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
