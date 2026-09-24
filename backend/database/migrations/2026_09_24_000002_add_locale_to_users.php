<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The account's language (Phase 27). Additive — one column with a
 * default, so every existing row is already valid.
 *
 * Why on the account and not only in the browser: a queued notification
 * email has no browser to ask. localStorage covers visitors who are not
 * logged in; this column is what lets a mail sent tomorrow go out in the
 * language the person actually reads.
 *
 * 8 characters rather than 3: 'ary' fits, and so would a regional tag
 * like 'ar-MA' or 'fr-MA' if one is ever added. The allowlist is
 * App\Enums\Locale, not the column width.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('locale', 8)->default('fr')->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('locale');
        });
    }
};
