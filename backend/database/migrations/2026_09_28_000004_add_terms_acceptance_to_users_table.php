<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Terms of Use / Privacy Policy acceptance.
 *
 *   terms_accepted_at  when this account last accepted — null means never
 *                       (every account that existed before this migration).
 *   terms_version      WHICH version they accepted (see config/legal.php).
 *                       This is what makes re-acceptance possible: if the
 *                       wording changes later and 'terms_version' in the
 *                       config is bumped to 'v2', every user still holding
 *                       'v1' here is asked to accept again on their next
 *                       request (UserResource::needs_terms_acceptance).
 *
 * Both are system-controlled, not user input — same treatment as
 * role/status/free_contacts_remaining (see User::$fillable): the only
 * places that ever write them are AuthController::register() (new
 * signups) and AuthController::acceptTerms() (existing accounts catching
 * up, or re-accepting after a version bump).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('terms_accepted_at')->nullable()->after('has_used_free_listing');
            $table->string('terms_version')->nullable()->after('terms_accepted_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['terms_accepted_at', 'terms_version']);
        });
    }
};
