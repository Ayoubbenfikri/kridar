<?php

namespace Tests\Feature\Admin;

use App\Enums\PropertyStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Who can do what, and what a suspension actually stops.
 *
 * Every test here pins a rule that fails SILENTLY when it breaks. Nobody
 * notices that a suspended account still works, or that a profile update
 * can grant admin — there is no error, no broken page, just a hole. These
 * assertions are the only thing that would say so.
 */
class AdminSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function suspended(): User
    {
        $user = User::factory()->create();
        $user->status = UserStatus::Suspended;
        $user->save();

        return $user;
    }

    // ---------------------------------------------------------------
    // Suspension actually bites
    // ---------------------------------------------------------------

    public function test_a_suspended_account_cannot_use_an_authenticated_endpoint(): void
    {
        // The hole this closes: login() has always refused a suspended
        // account, but nothing checked status on the requests AFTER that.
        // Sanctum SPA auth is a session cookie, so a suspended user with
        // an open browser never needed to log in again — they kept full
        // access. EnsureAccountIsActive is what stops them.
        Sanctum::actingAs($this->suspended());

        $this->getJson('/api/v1/auth/me')->assertStatus(401);
    }

    public function test_a_suspended_account_cannot_write_anything(): void
    {
        // Not just reads. The important half is that a suspended owner
        // can no longer change data — and the assertion is on the
        // DATABASE, not on the status code, because a 401 that still
        // saved the change would pass a status-only test.
        $user = $this->suspended();
        $originalName = $user->name;

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/auth/profile', ['name' => 'Renamed while banned'])
            ->assertStatus(401);

        $this->assertSame($originalName, $user->fresh()->name);
    }

    public function test_an_active_account_is_untouched(): void
    {
        // The middleware runs on every api route, so the cost of getting
        // it wrong is the whole app going down, not one feature. This is
        // the "normal user still works" guard.
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/auth/me')->assertOk();
    }

    public function test_the_public_listing_index_still_works_for_a_guest(): void
    {
        // EnsureAccountIsActive resolves the user on EVERY api request,
        // including anonymous ones. A null user must simply pass through.
        Property::factory()->create();

        $this->getJson('/api/v1/properties')->assertOk();
    }

    // ---------------------------------------------------------------
    // The admin gate
    // ---------------------------------------------------------------

    public function test_a_normal_user_cannot_reach_the_admin_api(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/admin/stats')->assertStatus(403);
    }

    public function test_a_guest_cannot_reach_the_admin_api(): void
    {
        $this->getJson('/api/v1/admin/stats')->assertStatus(401);
    }

    public function test_a_normal_user_cannot_read_the_audit_trail(): void
    {
        // The log names accounts and carries IP addresses. It is the last
        // thing that should leak.
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/admin/activity')->assertStatus(403);
    }

    public function test_a_normal_user_cannot_suspend_anyone(): void
    {
        $victim = User::factory()->create();

        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/v1/admin/users/{$victim->id}/suspend")->assertStatus(403);

        $this->assertSame(UserStatus::Active, $victim->fresh()->status);
    }

    // ---------------------------------------------------------------
    // Privilege escalation
    // ---------------------------------------------------------------

    public function test_role_and_status_are_not_mass_assignable(): void
    {
        // fill() is the single funnel every `update($request->...)` call
        // in the app goes through. If role and status are unreachable
        // here, they are unreachable from any request body anywhere —
        // including in code nobody has written yet, which is the whole
        // point of removing them from $fillable rather than trusting each
        // FormRequest to keep leaving them out.
        $user = User::factory()->create();

        $user->fill([
            'role' => UserRole::Admin->value,
            'status' => UserStatus::Suspended->value,
        ]);

        $this->assertSame(UserRole::User, $user->role);
        $this->assertSame(UserStatus::Active, $user->status);
    }

    public function test_a_profile_update_cannot_grant_admin_or_lift_a_suspension(): void
    {
        // The same rule, end to end over HTTP. Note the request SUCCEEDS:
        // the extra keys are ignored rather than rejected, so a user
        // trying this gets no signal that they tried something.
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/auth/profile', [
            'name' => 'Still just a user',
            'role' => 'admin',
            'status' => 'suspended',
        ])->assertOk();

        $fresh = $user->fresh();

        $this->assertSame(UserRole::User, $fresh->role);
        $this->assertSame(UserStatus::Active, $fresh->status);
        $this->assertSame('Still just a user', $fresh->name);
    }

    // ---------------------------------------------------------------
    // Admin actions and their limits
    // ---------------------------------------------------------------

    public function test_an_admin_account_cannot_be_suspended(): void
    {
        $other = User::factory()->admin()->create();

        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/users/{$other->id}/suspend")->assertStatus(409);

        $this->assertSame(UserStatus::Active, $other->fresh()->status);
    }

    public function test_suspending_a_user_takes_their_published_listings_down(): void
    {
        $owner = User::factory()->create();
        $published = Property::factory()->for($owner, 'owner')->create();
        $draft = Property::factory()->draft()->for($owner, 'owner')->create();

        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/users/{$owner->id}/suspend")->assertOk();

        $this->assertSame(PropertyStatus::Suspended, $published->fresh()->status);

        // A draft was never public, so it is left alone — suspending it
        // would quietly change what the owner sees in their own dashboard
        // for no benefit.
        $this->assertSame(PropertyStatus::Draft, $draft->fresh()->status);
    }

    public function test_suspending_an_already_suspended_user_is_refused(): void
    {
        // The UI hides the button, which is exactly why this is tested:
        // the button is not what enforces it.
        $target = $this->suspended();

        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/users/{$target->id}/suspend")->assertStatus(409);
    }

    public function test_a_suspended_user_can_be_reactivated(): void
    {
        $target = $this->suspended();

        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/users/{$target->id}/activate")->assertOk();

        $this->assertSame(UserStatus::Active, $target->fresh()->status);
    }

    public function test_reactivating_an_account_does_not_republish_its_listings(): void
    {
        // Deliberate asymmetry. Some of those listings may have been
        // suspended on their own merits before the account ever was, and
        // silently putting a bad listing back live is worse than making
        // an admin approve each one by hand.
        $owner = User::factory()->create();
        $property = Property::factory()->for($owner, 'owner')->create();

        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/users/{$owner->id}/suspend")->assertOk();
        $this->assertSame(PropertyStatus::Suspended, $property->fresh()->status);

        $this->patchJson("/api/v1/admin/users/{$owner->id}/activate")->assertOk();
        $this->assertSame(PropertyStatus::Suspended, $property->fresh()->status);
    }

    public function test_reactivating_an_active_user_is_refused(): void
    {
        $target = User::factory()->create();

        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/users/{$target->id}/activate")->assertStatus(409);
    }

    public function test_approving_an_already_published_listing_is_refused(): void
    {
        // Without this guard, "Approuver" on a live listing silently reset
        // its published_at, moving it back to the top of the newest-first
        // listing for no reason anyone asked for.
        $property = Property::factory()->create();

        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/properties/{$property->id}/approve")->assertStatus(409);
    }

    public function test_an_admin_can_publish_a_listing_that_never_paid_its_fee(): void
    {
        // This is allowed on purpose — an admin override, for cash taken
        // at the office or a goodwill gesture. AdminAuditLogTest checks
        // that the override is recorded.
        $property = Property::factory()
            ->longTerm()
            ->unpaidPublication()
            ->draft()
            ->create();

        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson("/api/v1/admin/properties/{$property->id}/approve")->assertOk();

        $this->assertSame(PropertyStatus::Published, $property->fresh()->status);
    }
}
