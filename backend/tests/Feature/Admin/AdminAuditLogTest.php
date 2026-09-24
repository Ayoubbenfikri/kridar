<?php

namespace Tests\Feature\Admin;

use App\Enums\AdminAction;
use App\Models\AdminActivityLog;
use App\Models\Property;
use App\Models\User;
use App\Services\SettingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Every admin action leaves a trace.
 *
 * The point of these tests is not the happy path — it is that a future
 * change to AdminService cannot quietly stop writing the log. An audit
 * trail with a hole in it is worse than none, because it is trusted.
 */
class AdminAuditLogTest extends TestCase
{
    use RefreshDatabase;

    private function lastLog(): AdminActivityLog
    {
        // orderByDesc('id'), not latest(): several rows can land in the
        // same second and created_at would not separate them.
        $log = AdminActivityLog::query()->orderByDesc('id')->first();

        $this->assertNotNull($log, 'No audit row was written.');

        return $log;
    }

    public function test_suspending_a_user_is_recorded_with_who_what_and_how_much(): void
    {
        $admin = User::factory()->admin()->create();
        $owner = User::factory()->create();
        Property::factory()->count(2)->for($owner, 'owner')->create();

        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/users/{$owner->id}/suspend")->assertOk();

        $log = $this->lastLog();

        $this->assertSame(AdminAction::UserSuspended, $log->action);
        $this->assertSame($admin->id, $log->admin_id);
        $this->assertSame('User', $log->target_type);
        $this->assertSame($owner->id, $log->target_id);

        // Snapshotted, so the row still reads sensibly if the account is
        // later renamed or deleted.
        $this->assertSame($owner->name, $log->target_label);

        // The collateral damage, in the log. "Why did my two listings
        // disappear?" is answerable without re-deriving anything.
        $this->assertSame(2, $log->context['listings_suspended']);
    }

    public function test_reactivating_a_user_is_recorded_separately(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/users/{$target->id}/suspend")->assertOk();
        $this->patchJson("/api/v1/admin/users/{$target->id}/activate")->assertOk();

        $this->assertSame(AdminAction::UserActivated, $this->lastLog()->action);

        // Two distinct events, not one row overwritten. The history is
        // the product here.
        $this->assertSame(2, AdminActivityLog::query()->count());
    }

    public function test_publishing_a_listing_that_never_paid_records_the_override(): void
    {
        // The one admin action that costs Kridar money. approveProperty()
        // deliberately ignores the publication fee so an admin can take
        // cash at the office — this log entry is what keeps that from
        // being indistinguishable from a mistake or an abuse.
        $property = Property::factory()
            ->longTerm()
            ->unpaidPublication()
            ->draft()
            ->create();

        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/properties/{$property->id}/approve")->assertOk();

        $log = $this->lastLog();

        $this->assertSame(AdminAction::PropertyApproved, $log->action);
        $this->assertSame('Property', $log->target_type);
        $this->assertSame($property->title, $log->target_label);
        $this->assertSame('draft', $log->context['previous_status']);
        $this->assertTrue($log->context['owed_publication_fee']);
        $this->assertFalse($log->context['publication_fee_paid']);
    }

    public function test_suspending_a_listing_records_what_it_was_before(): void
    {
        $property = Property::factory()->create();

        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/properties/{$property->id}/suspend")->assertOk();

        $log = $this->lastLog();

        $this->assertSame(AdminAction::PropertySuspended, $log->action);
        $this->assertSame('published', $log->context['previous_status']);
        $this->assertSame($property->owner_id, $log->context['owner_id']);
    }

    public function test_changing_the_commission_rate_records_before_and_after(): void
    {
        // The change most likely to surface weeks later as an owner
        // complaint, and the one nobody could previously answer.
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->putJson('/api/v1/admin/settings', [
            SettingService::LISTING_FEE => 20,
            SettingService::COMMISSION_RATE => 15,
            SettingService::PAYPAL_RATE => 10.80,
        ])->assertOk();

        $log = $this->lastLog();

        $this->assertSame(AdminAction::SettingsUpdated, $log->action);

        // No single target — a settings change is about the platform.
        $this->assertNull($log->target_type);
        $this->assertNull($log->target_id);

        // Cast to float explicitly: these round-trip through JSON, where
        // 10.0 and 10 are the same value written two ways.
        $this->assertSame(10.0, (float) $log->context['before'][SettingService::COMMISSION_RATE]);
        $this->assertSame(15.0, (float) $log->context['after'][SettingService::COMMISSION_RATE]);
    }

    public function test_a_failed_action_writes_nothing(): void
    {
        // The log records what HAPPENED. A refused action did not happen,
        // and filling the trail with attempts would bury the real events.
        $other = User::factory()->admin()->create();

        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/users/{$other->id}/suspend")->assertStatus(409);

        $this->assertSame(0, AdminActivityLog::query()->count());
    }

    public function test_an_admin_can_read_the_trail_back(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/users/{$target->id}/suspend")->assertOk();

        $row = $this->getJson('/api/v1/admin/activity')->assertOk()->json('data.0');

        $this->assertSame(AdminAction::UserSuspended->value, $row['action']);
        $this->assertSame($admin->name, $row['admin']['name']);
        $this->assertSame($target->name, $row['target_label']);
    }

    public function test_the_trail_can_be_filtered_by_action(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();
        $property = Property::factory()->create();

        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/users/{$target->id}/suspend")->assertOk();
        $this->patchJson("/api/v1/admin/properties/{$property->id}/suspend")->assertOk();

        $filtered = $this->getJson('/api/v1/admin/activity?action='.AdminAction::PropertySuspended->value)
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $filtered);
        $this->assertSame(AdminAction::PropertySuspended->value, $filtered[0]['action']);
    }

    public function test_an_unknown_action_filter_returns_everything(): void
    {
        // Same lenient handling as ?type on /admin/payments: a bad query
        // string on a read-only listing is not worth a 422.
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/users/{$target->id}/suspend")->assertOk();

        $this->getJson('/api/v1/admin/activity?action=nonsense')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
