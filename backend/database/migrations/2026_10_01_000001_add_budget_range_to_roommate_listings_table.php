<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 'request' posts ("looking for a place") no longer share
 * price_per_person with 'offer' posts — a single number can't express
 * "I'm looking for something between 1000 and 1500 MAD / month". These
 * two new nullable columns are used only for type = 'request':
 *   - budget_min / budget_max — the poster's price range.
 *
 * price_per_person is untouched and stays 'offer'-only (rent asked per
 * roommate), exactly as before. Additive migration, per the project
 * convention (see kridar-pricing-model.md) — no migrate:fresh needed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roommate_listings', function (Blueprint $table) {
            $table->decimal('budget_min', 10, 2)->nullable()->after('price_per_person');
            $table->decimal('budget_max', 10, 2)->nullable()->after('budget_min');
        });
    }

    public function down(): void
    {
        Schema::table('roommate_listings', function (Blueprint $table) {
            $table->dropColumn(['budget_min', 'budget_max']);
        });
    }
};
