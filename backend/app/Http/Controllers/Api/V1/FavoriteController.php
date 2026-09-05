<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Services\FavoriteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function __construct(
        private readonly FavoriteService $favorites,
    ) {}

    /**
     * GET /favorites — the current user's saved properties, most
     * recently favorited first. Shaped exactly like GET /properties
     * (PropertyResource) so the frontend can reuse the same property
     * card component.
     */
    public function index(Request $request): JsonResponse
    {
        return PropertyResource::collection($this->favorites->listForUser($request->user()))
            ->response();
    }

    /**
     * POST /favorites/{property} — idempotent, see FavoriteService::add().
     */
    public function store(Request $request, Property $property): JsonResponse
    {
        $this->favorites->add($request->user(), $property);

        return response()->json([
            'message' => 'Added to favorites.',
            'favorited' => true,
        ], 201);
    }

    /**
     * DELETE /favorites/{property} — idempotent, see FavoriteService::remove().
     */
    public function destroy(Request $request, Property $property): JsonResponse
    {
        $this->favorites->remove($request->user(), $property);

        return response()->json([
            'message' => 'Removed from favorites.',
            'favorited' => false,
        ]);
    }
}
