<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Owner consent to publish their phone number on their listings.
 *
 * Off by default, and deliberately so: owners gave their number to
 * create an account, not to have it shown to strangers. Nobody's number
 * becomes visible until they switch this on themselves from
 * /account/settings.
 *
 * Purely additive — `php artisan migrate`, no data touched.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('show_phone_on_listings')->default(false)->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('show_phone_on_listings');
        });
    }
};
