<?php

namespace App\Services;

use App\Enums\AnalyticsEventName;
use App\Models\AnalyticsEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

/**
 * Records page views and tracked actions for the admin analytics
 * (Phase A1). See claude/kridar-analytics-plan.md for the privacy model.
 *
 * Everything that could be faked by the browser is worked out HERE, from
 * the request itself: who the visitor is (a daily hash), which device,
 * which language. The browser only says WHAT happened and WHERE.
 */
class AnalyticsService
{
    /**
     * User-Agents that are not a person: search engines that run
     * JavaScript (Googlebot does), headless browsers, monitoring and
     * scripts. Their visits are dropped so the numbers mean "people".
     *
     * Deliberately NOT "whatsapp" or "telegram": a link opened inside
     * those apps is a real visitor, and their link-preview robots never
     * run JavaScript, so they never reach this endpoint anyway.
     */
    private const BOT_PATTERN = '/bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|curl|wget|python|httpclient|guzzle|okhttp|java\//i';

    /**
     * Returns the stored event, or null when the request was deliberately
     * not counted (a bot, or an admin browsing their own site).
     *
     * @param  array{name: string, path: string, property_id?: int|null, roommate_listing_id?: int|null, referrer?: string|null, is_entry?: bool, utm_source?: string|null}  $data
     */
    public function record(Request $request, array $data): ?AnalyticsEvent
    {
        $userAgent = (string) $request->userAgent();

        if ($userAgent === '' || preg_match(self::BOT_PATTERN, $userAgent) === 1) {
            return null;
        }

        $user = $request->user('sanctum');

        // The admin's own clicks would only inflate the numbers they read.
        if ($user?->isAdmin()) {
            return null;
        }

        $name = AnalyticsEventName::from($data['name']);
        $isEntry = $name === AnalyticsEventName::PageView && (bool) ($data['is_entry'] ?? false);

        return AnalyticsEvent::create([
            'name' => $name,
            'path' => $this->cleanPath($data['path']),
            // An id is only kept on the events it belongs to (see
            // AnalyticsEventName::aboutAProperty): a page_view sent with a
            // property_id would otherwise count as a listing view.
            'property_id' => in_array($name, AnalyticsEventName::aboutAProperty(), true)
                ? ($data['property_id'] ?? null)
                : null,
            'roommate_listing_id' => in_array($name, AnalyticsEventName::aboutARoommatePost(), true)
                ? ($data['roommate_listing_id'] ?? null)
                : null,
            'visitor_hash' => $this->visitorHash($request->ip() ?? '', $userAgent),
            'is_authenticated' => $user !== null,
            // Only a page view can be the first page of a visit, and only
            // that first page carries the source (see the request).
            'is_entry' => $isEntry,
            'referrer_host' => $isEntry ? $this->externalHost($data['referrer'] ?? null) : null,
            'utm_source' => $isEntry && isset($data['utm_source']) ? mb_strtolower($data['utm_source']) : null,
            'device' => $this->device($userAgent),
            // Set by the SetLocale middleware from the account or the
            // Accept-Language header - already validated against Locale.
            'locale' => App::getLocale(),
        ]);
    }

    /**
     * Same visitor = same hash for ONE day only.
     *
     * The daily secret is derived from APP_KEY and today's date, so it
     * needs no storage, cannot be guessed from outside, and changes at
     * midnight: nobody (not even us) can link a visitor's Monday to their
     * Tuesday, and the IP itself is never written anywhere.
     */
    public function visitorHash(string $ip, string $userAgent): string
    {
        $dailySecret = hash_hmac('sha256', now()->toDateString(), (string) config('app.key'));

        return hash_hmac('sha256', $ip.'|'.$userAgent, $dailySecret);
    }

    /** mobile | tablet | desktop, from the User-Agent. */
    public function device(string $userAgent): string
    {
        if (preg_match('/ipad|tablet|playbook|silk|android(?!.*mobile)/i', $userAgent) === 1) {
            return 'tablet';
        }

        if (preg_match('/mobi|iphone|ipod|android|windows phone/i', $userAgent) === 1) {
            return 'mobile';
        }

        return 'desktop';
    }

    /**
     * "https://www.google.com/search?q=..." -> "google.com".
     *
     * Only the host is kept (the rest of a URL can carry someone's search
     * or personal data), and a referrer from Krihouse itself is dropped:
     * moving from one of our pages to another is not a "source".
     */
    public function externalHost(?string $referrer): ?string
    {
        if ($referrer === null || $referrer === '') {
            return null;
        }

        $scheme = parse_url($referrer, PHP_URL_SCHEME);
        $host = parse_url($referrer, PHP_URL_HOST);

        if (! in_array($scheme, ['http', 'https'], true) || ! is_string($host) || $host === '') {
            return null;
        }

        $host = $this->withoutWww(mb_strtolower($host));

        $ownHosts = array_filter(array_map(
            fn ($url) => is_string($url) ? parse_url($url, PHP_URL_HOST) : null,
            [config('app.url'), config('app.frontend_url')],
        ));

        foreach ($ownHosts as $ownHost) {
            if ($host === $this->withoutWww(mb_strtolower($ownHost))) {
                return null;
            }
        }

        return mb_substr($host, 0, 100);
    }

    /** "/properties/7?x=1#top" -> "/properties/7" */
    private function cleanPath(string $path): string
    {
        $clean = parse_url($path, PHP_URL_PATH);

        return is_string($clean) && $clean !== '' ? mb_substr($clean, 0, 255) : '/';
    }

    private function withoutWww(string $host): string
    {
        return str_starts_with($host, 'www.') ? substr($host, 4) : $host;
    }
}
