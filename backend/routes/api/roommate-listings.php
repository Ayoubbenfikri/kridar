<?php

use App\Http\Controllers\Api\V1\RoommateListingController;
use App\Http\Controllers\Api\V1\RoommateListingImageController;
use Illuminate\Support\Facades\Route;

Route::get('/roommate-listings', [RoommateListingController::class, 'index']);

// Registered before the {roommate_listing} route below, on purpose:
// Laravel matches routes in registration order, and {roommate_listing} has
// no constraint that would stop it from swallowing "mine" as an id/slug
// first if this came after it.
Route::middleware(['auth:sanctum', 'verified'])
    ->get('/roommate-listings/mine', [RoommateListingController::class, 'mine']);

Route::get('/roommate-listings/{roommate_listing}', [RoommateListingController::class, 'show']);

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::post('/roommate-listings', [RoommateListingController::class, 'store']);
    Route::put('/roommate-listings/{roommate_listing}', [RoommateListingController::class, 'update']);
    Route::patch('/roommate-listings/{roommate_listing}', [RoommateListingController::class, 'update']);
    Route::delete('/roommate-listings/{roommate_listing}', [RoommateListingController::class, 'destroy']);
    Route::patch('/roommate-listings/{roommate_listing}/publish', [RoommateListingController::class, 'publish']);
    Route::patch('/roommate-listings/{roommate_listing}/unpublish', [RoommateListingController::class, 'unpublish']);

    Route::post('/roommate-listings/{roommate_listing}/images', [RoommateListingImageController::class, 'store']);
    Route::delete('/roommate-listings/{roommate_listing}/images/{image}', [RoommateListingImageController::class, 'destroy']);
});
