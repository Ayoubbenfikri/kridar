<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Partager une annonce" — a message can optionally carry a reference to
 * ONE listing (a property OR a roommate post, never both — same
 * "two nullable FKs, enforced in the service not the database"
 * convention as conversations.property_id/roommate_listing_id).
 *
 * nullOnDelete rather than restrict/cascade: a shared listing being
 * deleted later must not delete or block-delete the message itself —
 * the conversation history stays, the attached card just stops
 * resolving (MessageResource already handles a null relation the same
 * way ConversationResource does for a deleted listing).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('shared_property_id')->nullable()->after('body')
                ->constrained('properties')->nullOnDelete();
            $table->foreignId('shared_roommate_listing_id')->nullable()->after('shared_property_id')
                ->constrained('roommate_listings')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shared_property_id');
            $table->dropConstrainedForeignId('shared_roommate_listing_id');
        });
    }
};
