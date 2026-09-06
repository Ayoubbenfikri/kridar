<?php

use App\Http\Controllers\Api\V1\AmenityController;
use Illuminate\Support\Facades\Route;

Route::get('/amenities', [AmenityController::class, 'index']);
