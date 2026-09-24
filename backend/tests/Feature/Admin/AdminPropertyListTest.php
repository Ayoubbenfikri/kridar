<?php

namespace Tests\Feature\Admin;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The shape of GET /admin/properties.
 *
 * This file exists because of a real crash. PropertyResource emits
 * `images` through whenLoaded(), so an endpoint whose query forgot to
 * eager-load the relation omits the key from the JSON entirely — while
 * types/property.ts declares `images` as always present and
 * strictNullChecks is off, so TypeScript says nothing. The result was a
 * white screen on /admin/properties as soon as there was one row to
 * render, and nothing on either side of the stack noticed.
 *
 * A shape test is the only thing that catches that class of bug, so the
 * keys the page indexes into are pinned here.
 */
class AdminPropertyListTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function firstRow(): array
    {
        return $this->getJson('/api/v1/admin/properties')->assertOk()->json('data.0');
    }

    public function test_the_list_carries_the_cover_image(): void
    {
        $property = Property::factory()->create();

        PropertyImage::query()->create([
            'property_id' => $property->id,
            'path' => 'properties/cover.jpg',
            'is_cover' => true,
            'sort_order' => 0,
        ]);

        Sanctum::actingAs(User::factory()->admin()->create());

        $row = $this->firstRow();

        // The assertion that matters is that the KEY exists at all — the
        // page does property.images.find(...) on it.
        $this->assertArrayHasKey('images', $row);
        $this->assertCount(1, $row['images']);
        $this->assertTrue($row['images'][0]['is_cover']);
    }

    public function test_a_listing_with_no_photos_still_carries_an_images_key(): void
    {
        Property::factory()->create();

        Sanctum::actingAs(User::factory()->admin()->create());

        $row = $this->firstRow();

        $this->assertArrayHasKey('images', $row);
        $this->assertSame([], $row['images']);
    }

    public function test_the_list_names_the_owner_without_leaking_their_contact_details(): void
    {
        // Same rule as the public listing (OwnerPhoneVisibilityTest): the
        // owner block is built by hand in PropertyResource and can only
        // ever contain id and name. Pinned here too, because this endpoint
        // loads a different column set and is the one an admin screen puts
        // on display.
        $owner = User::factory()->create(['phone' => '0612345678']);
        Property::factory()->for($owner, 'owner')->create();

        Sanctum::actingAs(User::factory()->admin()->create());

        $row = $this->firstRow();

        $this->assertSame(['id', 'name'], array_keys($row['owner']));
        $this->assertSame($owner->name, $row['owner']['name']);
    }
}
