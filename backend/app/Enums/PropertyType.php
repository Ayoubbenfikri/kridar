<?php

namespace App\Enums;

enum PropertyType: string
{
    case Apartment = 'apartment';
    case Villa = 'villa';
    case Studio = 'studio';
    case Riad = 'riad';
    case Office = 'office';
}
