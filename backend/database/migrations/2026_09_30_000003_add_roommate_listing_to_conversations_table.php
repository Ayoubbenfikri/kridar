<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets a conversation be about a roommate post instead of a property.
 *
 * A conversation row still points at exactly ONE listing — that rule is
 * enforced in code (MessagingService), not here, same convention as the
 * rest of this codebase (see RoommateListing's own status/type columns).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            // Was required; a conversation can now be about either kind
            // of listing, so exactly one of the two id columns is set.
            $table->foreignId('property_id')->nullable()->change();

            $table->foreignId('roommate_listing_id')
                ->nullable()
                ->after('property_id')
                ->constrained('roommate_listings')
                ->restrictOnDelete();

            // Mirrors the existing unique(property_id, guest_id): one
            // thread per person per listing. NULLs never collide in a
            // unique index, so this coexists fine with property threads.
            $table->unique(['roommate_listing_id', 'guest_id']);
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropUnique(['roommate_listing_id', 'guest_id']);
            $table->dropConstrainedForeignId('roommate_listing_id');
            $table->foreignId('property_id')->nullable(false)->change();
        });
    }
};
