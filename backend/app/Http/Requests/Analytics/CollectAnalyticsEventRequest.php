<?php

namespace App\Http\Requests\Analytics;

use App\Enums\AnalyticsEventName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * POST /analytics/collect (Phase A1).
 *
 * Public on purpose - most visitors are not logged in - so it is strict:
 * only a known event name, a short internal path and plain ids. Device,
 * visitor and language are NOT accepted from the browser at all, the
 * server works them out itself (AnalyticsService).
 */
class CollectAnalyticsEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $propertyEvents = array_map(fn ($event) => $event->value, AnalyticsEventName::requiringAProperty());
        $roommateEvents = array_map(fn ($event) => $event->value, AnalyticsEventName::requiringARoommatePost());

        return [
            'name' => ['required', Rule::enum(AnalyticsEventName::class)],

            // An internal page only: "/properties/7", never a full URL.
            'path' => ['required', 'string', 'max:255', 'starts_with:/'],

            'property_id' => ['nullable', 'required_if:name,'.implode(',', $propertyEvents), 'integer', 'min:1'],
            'roommate_listing_id' => ['nullable', 'required_if:name,'.implode(',', $roommateEvents), 'integer', 'min:1'],

            // document.referrer of the landing page (the previous site).
            'referrer' => ['nullable', 'string', 'max:2048'],

            // True on the FIRST page of a visit (the landing page). Only
            // that one tells where the visitor came from: in a single-page
            // app document.referrer stays the same on every later page.
            'is_entry' => ['sometimes', 'boolean'],

            // ?utm_source=facebook on an ad link.
            'utm_source' => ['nullable', 'string', 'max:50', 'regex:/^[A-Za-z0-9._-]+$/'],
        ];
    }
}
