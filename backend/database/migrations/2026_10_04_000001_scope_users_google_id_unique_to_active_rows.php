<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Same bug as 2026_09_29_000001_scope_users_email_unique_to_active_rows,
     * one column over.
     *
     * `google_id` was created with a plain, always-on unique index. User
     * uses SoftDeletes, so after "Delete my account" the row is still in
     * the table WITH its google_id. Google's id for a person never changes,
     * so when that same person comes back with "Continue with Google":
     *
     *   - GoogleAuthController looks the user up with User::where(...),
     *     which hides soft-deleted rows -> finds nothing -> goes to
     *     "brand new account" -> INSERTs the same google_id again
     *   - the plain unique index rejects it -> 500 Server Error.
     *
     * (The classic registration form never hit this because it doesn't
     * write a google_id at all, and its email already has the scoped
     * index from the migration above.)
     *
     * The fix is the same one used for email: a composite unique index on
     * (google_id, deleted_at). Every active user has deleted_at = NULL,
     * and MySQL/SQLite treat NULL as never equal to another NULL, so this
     * still guarantees at most one ACTIVE user per Google account — and a
     * deleted row simply stops blocking it. Users without Google have
     * google_id = NULL, which was never constrained anyway.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_google_id_unique');
            $table->unique(['google_id', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['google_id', 'deleted_at']);
            $table->unique('google_id');
        });
    }
};
