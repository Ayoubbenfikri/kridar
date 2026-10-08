<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Security audit (Oct 2026): standard browser-hardening headers on every
 * response Laravel sends - the JSON API, and also the React app itself
 * when it is served through routes/web.php's fallback (a deep link such
 * as /properties/7).
 *
 *   X-Content-Type-Options   the browser must trust our Content-Type and
 *                            never "guess" that a response is HTML/JS.
 *   X-Frame-Options          nobody can load Krihouse inside an <iframe>
 *                            on their own site (clickjacking).
 *   Referrer-Policy          other sites only see "krihouse.com", never
 *                            the full URL a visitor came from.
 *   Strict-Transport-Security  HTTPS only, sent only on an HTTPS request
 *                            (it would be ignored on HTTP anyway, and must
 *                            never reach a local http:// dev setup).
 *
 * A header already set further down (a controller, a package) is kept.
 */
class AddSecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $headers = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
        ];

        if ($request->isSecure()) {
            $headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
        }

        foreach ($headers as $name => $value) {
            if (! $response->headers->has($name)) {
                $response->headers->set($name, $value);
            }
        }

        return $response;
    }
}
