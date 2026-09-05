<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate for the /owner/* routes. There is no separate "owner" role in
 * this app - see the architecture doc: "ownership is implicit via
 * properties.owner_id" - so being an owner just means owning at least
 * one property. Runs after auth:sanctum, so $request->user() is always
 * set here.
 */
class EnsureUserOwnsAProperty
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()->properties()->exists()) {
            abort(403, 'You need at least one property to access the owner dashboard.');
        }

        return $next($request);
    }
}
