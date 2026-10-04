<?php

namespace App\Enums;

/**
 * Legal status of a property that is for sale. Optional — the seller may
 * leave it blank. Only meaningful for listing_type = sale.
 *
 * Kridar only DISPLAYS what the seller declares; it does not verify
 * anything. The buyer is expected to check the paperwork (notary, land
 * registry) before any purchase, exactly as with any classified listing.
 */
enum LegalStatus: string
{
    // Titre foncier — registered property.
    case Titled = 'titled';

    // En cours d'immatriculation.
    case Registering = 'registering';

    // Melkia — property not (yet) registered.
    case Melkia = 'melkia';

    case Other = 'other';
}
