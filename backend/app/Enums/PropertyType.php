<?php

namespace App\Enums;

enum PropertyType: string
{
    case Apartment = 'apartment';
    case Villa = 'villa';
    case Studio = 'studio';
    case Riad = 'riad';
    case Office = 'office';

    // Added with property sales. `Land` (terrain) can only be SOLD —
    // renting a plot makes no sense in Kridar's model, so StorePropertyRequest
    // refuses it for rentals. `Commercial` (local commercial) works for both.
    case Land = 'land';
    case Commercial = 'commercial';
}
