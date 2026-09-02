<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();

            // Restrict, not cascade: deleting a user who still owns
            // properties should fail loudly rather than silently wipe
            // listings (and every reservation tied to them).
            $table->foreignId('owner_id')->constrained('users')->restrictOnDelete();

            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');

            $table->string('property_type'); // App\Enums\PropertyType
            $table->string('rental_type');    // App\Enums\RentalType (short_term|long_term|both)

            $table->string('address');
            $table->string('city');
            $table->string('region')->nullable();
            $table->string('country')->default('Morocco');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->unsignedTinyInteger('bedrooms')->default(0);
            $table->unsignedTinyInteger('bathrooms')->default(0);
            $table->unsignedSmallInteger('max_guests')->nullable(); // required if rental_type is short_term/both
            $table->decimal('area_sqm', 8, 2)->nullable();

            // Nullable because a property only needs the price for the
            // rental type(s) it actually offers (validated in PropertyService, Phase 5).
            $table->decimal('price_per_night', 10, 2)->nullable();
            $table->decimal('price_per_month', 10, 2)->nullable();
            $table->string('currency', 3)->default('MAD');

            $table->string('status')->default('draft'); // App\Enums\PropertyStatus
            $table->boolean('is_featured')->default(false);
            $table->timestamp('published_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['city', 'status']);
            $table->index('rental_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
