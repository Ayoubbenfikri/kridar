<?php

namespace App\Enums;

enum RoommateListingType: string
{
    // "I already have a place and I'm looking for a roommate."
    case Offer = 'offer';

    // "I don't have a place yet and I'm looking for someone to rent/share with."
    case Request = 'request';
}
