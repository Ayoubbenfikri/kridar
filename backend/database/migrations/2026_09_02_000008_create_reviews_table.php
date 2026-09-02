<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();

            // One review per completed reservation.
            $table->foreignId('reservation_id')->unique()->constrained()->cascadeOnDelete();

            // Denormalized alongside reservation_id purely so "all reviews
            // for this property" doesn't need a join through reservations.
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('guest_id')->constrained('users')->restrictOnDelete();

            $table->unsignedTinyInteger('rating'); // 1-5, enforced in StoreReviewRequest (Phase 9)
            $table->text('comment');
            $table->text('owner_reply')->nullable();
            $table->timestamp('owner_replied_at')->nullable();

            $table->timestamps();

            $table->index('property_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
