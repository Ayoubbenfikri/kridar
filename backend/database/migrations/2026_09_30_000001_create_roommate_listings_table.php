<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Shared Accommodation / Roommates (Phase R1).
 *
 * One table, two post types (App\Enums\RoommateListingType):
 *   - 'offer'   — "I have a place, looking for a roommate." Uses address,
 *                 beds/bedrooms, furnished, photos of the actual room.
 *   - 'request' — "I don't have a place, looking to join someone."
 *                 Uses city/neighborhood + budget + people_count only;
 *                 address stays null (there is nothing to give an
 *                 address for) and photos are optional.
 *
 * Which fields are actually REQUIRED per type is enforced in
 * StoreRoommateListingRequest, not here — same pattern as
 * properties.price_per_night being nullable at the database level and
 * required only for the rental types that need it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roommate_listings', function (Blueprint $table) {
            $table->id();

            // Restrict, same reasoning as properties.owner_id: a user who
            // still has a roommate post should not be silently wiped out
            // from under it (and everything referencing it, once Phase R2
            // wires up messaging).
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();

            $table->string('type'); // App\Enums\RoommateListingType (offer|request)

            $table->string('title');
            $table->text('description');

            $table->string('city');
            $table->string('neighborhood')->nullable();

            // 'offer' only — a 'request' poster has no place to give an
            // address for.
            $table->string('address')->nullable();

            // 'offer': rent asked per roommate. 'request': the poster's
            // budget. Same column, same unit, on purpose — a "price
            // range" search filter works identically against both types
            // without needing two separate columns to compare against.
            $table->decimal('price_per_person', 10, 2)->nullable();
            $table->string('currency', 3)->default('MAD');

            $table->unsignedTinyInteger('beds')->nullable();
            $table->unsignedTinyInteger('bedrooms')->nullable();
            $table->boolean('furnished')->nullable();

            // 'request' only — how many people are looking together (e.g.
            // two friends sharing one search). Null for an 'offer'.
            $table->unsignedTinyInteger('people_count')->nullable();

            $table->date('available_from')->nullable();

            // App\Enums\RoommateListingStatus — deliberately simpler than
            // PropertyStatus (no pending_review/suspended): roommate
            // posts publish instantly, no admin moderation queue.
            $table->string('status')->default('draft');
            $table->timestamp('published_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['city', 'status']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roommate_listings');
    }
};
