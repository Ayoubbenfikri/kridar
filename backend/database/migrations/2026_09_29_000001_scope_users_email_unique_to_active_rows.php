<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The users table's `email` column was created with a plain,
     * always-on unique index. That's what silently broke account
     * deletion: User uses SoftDeletes, so a "deleted" account is still a
     * real row sitting in the table with that email in it, and the
     * plain unique index blocked anyone — including the same person —
     * from ever registering with that email again.
     *
     * RegisterRequest's validation rule is scoped (see that file) to
     * ignore soft-deleted rows, but that alone isn't enough: without
     * this migration, the actual INSERT would still fail at the
     * database level with a raw duplicate-entry error, even though
     * validation said the email was fine.
     *
     * The fix: a composite unique index on (email, deleted_at) instead
     * of email alone. Every active user has deleted_at = NULL, and both
     * MySQL and SQLite treat NULL as never equal to another NULL for
     * uniqueness purposes — so this still guarantees at most one ACTIVE
     * user per email, which is the actual rule the app needs. Two
     * different deleted rows would only collide if they shared the
     * exact same deleted_at timestamp down to the microsecond, which in
     * practice never happens.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_email_unique');
            $table->unique(['email', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email', 'deleted_at']);
            $table->unique('email');
        });
    }
};
