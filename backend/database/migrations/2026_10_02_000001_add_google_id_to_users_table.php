<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Connect with Google" (Google OAuth sign-in).
 *
 * google_id stores the stable numeric "sub" Google sends back for the
 * account (GoogleAuthController reads it via Socialite's getId()) — never
 * the email, which a person could change on Google's side. Nullable
 * because every existing user registered the classic way and has none;
 * unique so the same Google account can never attach to two Kridar users.
 *
 * No password column change needed: a Google-only account still gets a
 * normal (but unusable, since nobody types it) hashed password via
 * Hash::make(Str::random(40)) in GoogleAuthController, so every other
 * password-related code path (login, "change password", the `password`
 * cast) keeps working exactly as it does today without a nullable check.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id')->nullable()->unique()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('google_id');
        });
    }
};
