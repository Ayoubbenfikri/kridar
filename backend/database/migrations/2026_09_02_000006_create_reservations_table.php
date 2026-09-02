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
