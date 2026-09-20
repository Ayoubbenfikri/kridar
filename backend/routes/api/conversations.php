<?php

use App\Http\Controllers\Api\V1\ConversationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'verified'])->group(function () {

    Route::get('/conversations', [ConversationController::class, 'index']);

    // MUST stay above /conversations/{conversation} — both are GET, and
    // a route model binding would otherwise try to resolve a
    // Conversation with the id "unread-count" and 404.
    Route::get('/conversations/unread-count', [ConversationController::class, 'unreadCount']);

    Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
    Route::patch('/conversations/{conversation}/read', [ConversationController::class, 'markRead']);

    /*
    | Writes are throttled. Anyone with a verified account can reach any
    | owner who published a listing — that is the point of the feature,
    | and also the whole abuse surface. 30 messages a minute is far more
    | than a human conversation needs and far less than a script wants.
    */
    Route::middleware('throttle:30,1')->group(function () {
        Route::post('/conversations', [ConversationController::class, 'store']);
        Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'storeMessage']);
    });
});
