<?php

namespace Tests\Feature\Payments;

use App\Models\MessagingPass;
use App\Models\User;
use App\Services\SettingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase 29 (monetization overhaul) — buying a 7 or 15 day unlimited
 * messaging pass once the 5 free contacts are used up.
 */
class MessagingPackTest extends TestCase
{
    use RefreshDatabase;

    public function test_buying_a_7_day_pack_grants_access_once_paid(): void
    {
        $user = User::factory()->withNoFreeContacts()->create();
        Sanctum::actingAs($user);

        $started = $this->postJson('/api/v1/messaging/packs', ['duration' => '7d'])
            ->assertCreated()
            ->json();

        $this->assertSame('messaging_pack', $started['payment']['type']);

        // Not active yet — the payment has not settled.
        $this->assertFalse((bool) $user->fresh()->activeMessagingPass()?->isActive());

        $this->get("/api/v1/payments/{$started['payment']['id']}/return")->assertRedirect();

        $pass = MessagingPass::where('user_id', $user->id)->firstOrFail();
        $this->assertSame(7, $pass->duration_days);
        $this->assertNotNull($pass->expires_at);
        $this->assertTrue($pass->fresh()->isActive());
    }

    public function test_a_15_day_pack_charges_the_configured_15_day_fee(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $started = $this->postJson('/api/v1/messaging/packs', ['duration' => '15d'])
            ->assertCreated()
            ->json();

        $this->assertEquals(
            app(SettingService::class)->messagingPackFee('15d'),
            (float) $started['payment']['amount'],
        );
    }

    public function test_an_unknown_duration_is_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/messaging/packs', ['duration' => '30d'])
            ->assertStatus(422);
    }

    public function test_buying_a_pack_is_refused_while_kridar_is_free(): void
    {
        config()->set('payments.enabled', false);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/messaging/packs', ['duration' => '7d'])
            ->assertStatus(409);

        $this->assertDatabaseCount('messaging_passes', 0);
    }
}
