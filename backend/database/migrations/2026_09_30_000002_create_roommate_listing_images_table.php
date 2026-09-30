<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Identical shape to property_images (Phase R1) — same upload flow will
 * be reused (see PropertyImageService for the pattern this mirrors).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roommate_listing_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('roommate_listing_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->boolean('is_cover')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roommate_listing_images');
    }
};
