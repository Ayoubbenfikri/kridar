<?php

namespace App\Enums;

/**
 * Condition of a property that is for sale. Optional — the seller may
 * leave it blank. Only meaningful for listing_type = sale.
 */
enum PropertyCondition: string
{
    case New = 'new';
    case Good = 'good';
    case ToRenovate = 'to_renovate';
}
