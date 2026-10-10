<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase A1 (admin analytics) — one row per page view or tracked action.
 *
 * Privacy by design (see claude/kridar-analytics-plan.md):
 *   - no user_id, no IP address, no cookie id. A visitor is only a daily
 *     hash (visitor_hash), which changes every day;
 *   - rows older than 12 months are deleted by a scheduled command
 *     (Phase A2).
 *
 * property_id / roommate_listing_id are plain columns, NOT foreign keys
 * on purpose: deleting a listing must never be blocked by its view
 * history, and statistics about a deleted listing are still statistics.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();

            // App\Enums\AnalyticsEventName
            $table->string('name', 40);

            // The page, without its query string (e.g. /properties/7).
            $table->string('path', 255);

            $table->unsignedBigInteger('property_id')->nullable();
            $table->unsignedBigInteger('roommate_listing_id')->nullable();

            // hash(daily secret + IP + browser) - see AnalyticsService.
            $table->char('visitor_hash', 64);

            $table->boolean('is_authenticated')->default(false);

            // True on the first page of a visit (the landing page) - the
            // only row where referrer_host / utm_source are filled in, so
            // "sources" are counted once per visit, not once per page.
            $table->boolean('is_entry')->default(false);

            // Where the visitor came from: only the host (google.com),
            // never the full URL of the previous site.
            $table->string('referrer_host', 100)->nullable();
            $table->string('utm_source', 50)->nullable();

            // mobile | tablet | desktop
            $table->string('device', 10);

            // App\Enums\Locale value (fr | en | ary)
            $table->string('locale', 5);

            // Only created_at: an event is never updated.
            $table->timestamp('created_at')->useCurrent();

            // The admin page always filters by date first, then groups by
            // name / page / listing.
            $table->index('created_at');
            $table->index(['name', 'created_at']);
            $table->index('property_id');
            $table->index('roommate_listing_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
    }
};
