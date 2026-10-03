<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Edit / delete your own message.
 *
 * deleted_at is a PLAIN column here, not Eloquent's SoftDeletes trait —
 * Message deliberately does NOT `use SoftDeletes`. The trait's global
 * scope would silently exclude a deleted message from every query
 * (the conversation thread included), making it vanish instead of
 * showing "Message supprimé" where it was — the opposite of what this
 * feature needs. The real body stays in the database either way
 * (MessageResource hides it once deleted_at is set) — nothing is
 * actually destroyed, same "archive, don't erase" convention as
 * PropertyStatus::Archived elsewhere in this app.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->timestamp('edited_at')->nullable()->after('body');
            $table->timestamp('deleted_at')->nullable()->after('edited_at');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['edited_at', 'deleted_at']);
        });
    }
};
