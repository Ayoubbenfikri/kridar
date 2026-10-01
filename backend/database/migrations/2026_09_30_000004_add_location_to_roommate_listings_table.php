<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds an optional map position to a roommate post — same columns, same
 * precision, as properties.latitude/longitude (see
 * 2026_09_02_000002_create_properties_table.php). Only meaningful for an
 * 'offer' post (there is a real place to point at); a 'request' post has
 * no address to begin with (see the base roommate_listings migration),
 * so it stays null there too — enforced in the form, not the database.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roommate_listings', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('address');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('roommate_listings', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
