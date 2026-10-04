<?php

namespace App\Enums;

/**
 * What a property listing is FOR: renting it out, or selling it.
 *
 * Stored as a plain string on properties.listing_type (not a MySQL ENUM, so
 * adding a value later needs no schema change). Every row that existed
 * before this column was added is a rental, hence the 'rent' default in the
 * migration.
 *
 * This is deliberately a separate notion from RentalType (short_term /
 * long_term / both): RentalType says HOW LONG a rental lasts, ListingType
 * says whether it is a rental at all. A property for sale has no
 * rental_type (that column is nullable), no nightly/monthly price, and can
 * never be reserved — see StoreReservationRequest.
 */
enum ListingType: string
{
    case Rent = 'rent';
    case Sale = 'sale';
}
