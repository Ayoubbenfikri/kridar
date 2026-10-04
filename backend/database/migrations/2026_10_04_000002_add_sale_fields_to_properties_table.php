<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Property sales ("buying") live on the same table as rentals, told
     * apart by `listing_type`. See App\Enums\ListingType.
     *
     * Additive on purpose: every existing row becomes listing_type = 'rent'
     * through the column default, so nothing about current rentals changes
     * and production can run this with a plain `php artisan migrate --force`.
     *
     * `rental_type` becomes NULLABLE because a property for sale has no
     * rental type. It stays required for rentals — that is enforced in
     * StorePropertyRequest, not at the database level.
     *
     * The column is called `property_condition` rather than `condition`
     * because CONDITION is a reserved word in MySQL: Eloquent quotes it
     * for you, but any raw query would break on it.
     *
     * Adding the columns and changing rental_type are two separate
     * Schema::table() calls on purpose: the test suite runs on SQLite,
     * where a column change rebuilds the whole table, and keeping it in
     * its own statement is the safe way to do that.
     */
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->string('listing_type')->default('rent')->after('slug'); // App\Enums\ListingType
            $table->decimal('sale_price', 14, 2)->nullable()->after('price_per_month');
            $table->boolean('price_negotiable')->default(false)->after('sale_price');
            $table->unsignedSmallInteger('year_built')->nullable()->after('area_sqm');
            $table->string('property_condition')->nullable()->after('year_built'); // App\Enums\PropertyCondition
            $table->string('legal_status')->nullable()->after('property_condition'); // App\Enums\LegalStatus

            $table->index('listing_type');
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->string('rental_type')->nullable()->change();
        });
    }

    /**
     * Rolling back while sale rows exist will fail: rental_type goes back
     * to NOT NULL and those rows have none. Delete or convert the sale
     * listings first.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->string('rental_type')->nullable(false)->change();
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->dropIndex(['listing_type']);

            $table->dropColumn([
                'listing_type',
                'sale_price',
                'price_negotiable',
                'year_built',
                'property_condition',
                'legal_status',
            ]);
        });
    }
};
