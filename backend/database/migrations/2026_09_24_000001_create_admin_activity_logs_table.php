<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The admin audit trail (Phase 26).
 *
 * Until now nothing recorded who suspended an account, who published a
 * listing that had not paid its fee, or who moved the commission rate.
 * If the admin password ever leaks there would be no way to tell what was
 * done — and no way to tell an angry owner why their listing went down.
 *
 * Rows here are INSERT-ONLY. No code path updates or deletes one, and
 * none should be added: an audit trail you can edit is not an audit trail.
 *
 * Purely additive migration — no existing table or column is touched.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_activity_logs', function (Blueprint $table) {
            $table->id();

            // Restrict, like the rest of this schema: an admin account
            // must not be deletable out from under its own history.
            $table->foreignId('admin_id')->constrained('users')->restrictOnDelete();

            // App\Enums\AdminAction, e.g. 'user.suspended'.
            $table->string('action', 64);

            // What was acted on, stored loosely on purpose: no foreign
            // key, because a log row has to survive its target being
            // deleted. class_basename of the model ('User', 'Property'),
            // or null for an action with no single target (settings).
            $table->string('target_type', 64)->nullable();
            $table->unsignedBigInteger('target_id')->nullable();

            // The target's name/title AS IT WAS at the time. Snapshotted
            // deliberately: without it, a deleted or renamed target turns
            // the whole row into "someone suspended #47", which tells a
            // future reader nothing.
            $table->string('target_label')->nullable();

            // Free-form details per action: how many listings a suspension
            // took down, the settings before and after, whether an
            // approval overrode an unpaid publication fee.
            $table->json('context')->nullable();

            $table->string('ip_address', 45)->nullable();

            $table->timestamps();

            // The log is read newest-first, and filtered by action.
            $table->index(['action', 'created_at']);

            // "everything ever done to this listing" — the question an
            // owner complaint actually asks.
            $table->index(['target_type', 'target_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_activity_logs');
    }
};
