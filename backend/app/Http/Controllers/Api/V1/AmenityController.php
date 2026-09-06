<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AmenityResource;
use App\Models\Amenity;
use Illuminate\Http\JsonResponse;

/**
 * GET /amenities — public, read-only reference data (see
 * database/seeders/AmenitiesSeeder.php). Needed by the property
 * create/edit form so it can render the real amenity checklist instead
 * of the frontend guessing IDs.
 */
class AmenityController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'amenities' => AmenityResource::collection(Amenity::all()),
        ]);
    }
}
