<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 29 (monetization overhaul) — the two numbers the new messaging
 * and listing rules are built on.
 *
 *   free_contacts_remaining  starts at 5 for every user. Decremented by
 *                            MessagingCreditsService, but ONLY when a
 *                            genuinely NEW conversation is created — see
 *                            that class for why it never touches this
 *                            column before the conversation row exists.
 *
 *   has_used_free_listing    an owner's first-ever property is always
 *                            free, whatever its rental_type. This flag
 *                            flips to true the moment that first property
 *                            is created and NEVER flips back — deleting
 *                            that property must not hand out a second
 *                            free listing (PropertyService::create()).
 *
 * Both are system-controlled, not user input: neither is in
 * User::$fillable (same treatment as `role`/`status` — see the comment
 * there for why that matters).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedTinyInteger('free_contacts_remaining')->default(5)->after('show_phone_on_listings');
            $table->boolean('has_used_free_listing')->default(false)->after('free_contacts_remaining');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['free_contacts_remaining', 'has_used_free_listing']);
        });
    }
};
