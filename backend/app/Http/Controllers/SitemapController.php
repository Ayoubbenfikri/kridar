<?php

namespace App\Http\Controllers;

use App\Enums\PropertyStatus;
use App\Models\Property;
use Illuminate\Http\Response;

/**
 * GET /sitemap.xml — outside routes/api/*, not versioned: this is a
 * crawler-facing document, not part of the JSON API.
 *
 * Two kinds of URL:
 *
 *   1. A short, fixed list of the pages worth indexing (home, the
 *      listing search, /support). /login, /register, /ui and everything
 *      behind an account are left out on purpose - see robots.txt, which
 *      disallows crawling them at all. /terms and /privacy are also left
 *      out: they carry <meta name="robots" content="noindex"> (see
 *      TermsOfUsePage/PrivacyPolicyPage), and a noindex page has no
 *      business being advertised in a sitemap.
 *
 *   2. Every PUBLISHED property, generated from the database. This is
 *      the part that actually needs a controller instead of a static
 *      file in public/ - listings are added and removed constantly, and
 *      a hand-maintained sitemap would be stale within a day.
 *
 * Filtering on status alone (no publication_status / soft-delete check)
 * is deliberate and matches PropertyController@index: a property can
 * only ever reach PropertyStatus::Published through
 * PropertyService::publish(), which already refuses to publish one that
 * still owes its fee (see Property::isBlockedByPublicationFee), and
 * SoftDeletes means a deleted row is excluded from every plain query
 * here without an extra condition.
 */
class SitemapController extends Controller
{
    public function index(): Response
    {
        $baseUrl = rtrim(config('app.url'), '/');

        $urls = [
            ['loc' => $baseUrl.'/', 'changefreq' => 'daily', 'priority' => '1.0'],
            ['loc' => $baseUrl.'/properties', 'changefreq' => 'daily', 'priority' => '0.9'],
            ['loc' => $baseUrl.'/support', 'changefreq' => 'monthly', 'priority' => '0.3'],
        ];

        Property::query()
            ->where('status', PropertyStatus::Published)
            ->orderBy('id')
            ->chunk(200, function ($properties) use (&$urls, $baseUrl) {
                foreach ($properties as $property) {
                    $urls[] = [
                        'loc' => $baseUrl.'/properties/'.$property->id,
                        'lastmod' => ($property->updated_at ?? $property->published_at)?->toAtomString(),
                        'changefreq' => 'weekly',
                        'priority' => '0.7',
                    ];
                }
            });

        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');

        foreach ($urls as $entry) {
            $node = $xml->addChild('url');
            $node->addChild('loc', htmlspecialchars($entry['loc'], ENT_XML1));
            if (! empty($entry['lastmod'])) {
                $node->addChild('lastmod', $entry['lastmod']);
            }
            $node->addChild('changefreq', $entry['changefreq']);
            $node->addChild('priority', $entry['priority']);
        }

        return response($xml->asXML(), 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }
}
