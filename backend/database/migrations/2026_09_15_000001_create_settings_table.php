<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Platform settings the admin can change at runtime (Phase 22 —
 * pricing). Deliberately a plain key/value table rather than one column
 * per setting: adding a future setting is then a new row, not a new
 * migration.
 *
 * Nothing is seeded here on purpose — App\Services\SettingService holds
 * the defaults (20 DH / 10%) in code and falls back to them whenever a
 * row is missing, so a fresh database is already correct before an
 * admin has ever opened the settings page.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();

            // e.g. 'listing_publication_fee', 'short_term_commission_rate'
            $table->string('key')->unique();

            // Stored as a string and cast where it is read. A settings
            // table holds values of different shapes over time; keeping
            // the column loose avoids a migration for every new one.
            $table->string('value');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
