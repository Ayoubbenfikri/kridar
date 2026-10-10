<?php

namespace App\Enums;

/**
 * Every event the admin analytics can record (Phase A1).
 *
 * The allowlist for POST /analytics/collect: the browser can only ever
 * name one of these, so nobody can fill the table with invented
 * categories. Values are stored in the database, so - like AdminAction -
 * add cases, never rename them.
 */
enum AnalyticsEventName: string
{
    /** Any page opened in the React app (sent on every route change). */
    case PageView = 'page_view';

    /** A property details page was opened. Carries property_id. */
    case ListingView = 'listing_view';

    /** A roommate post was opened. Carries roommate_listing_id. */
    case RoommateView = 'roommate_view';

    case Search = 'search';
    case ContactClick = 'contact_click';
    case PhoneRevealClick = 'phone_reveal_click';
    case BookingRequest = 'booking_request';
    case FavoriteAdd = 'favorite_add';
    case ShareClick = 'share_click';
    case Register = 'register';
    case GoogleLoginClick = 'google_login_click';
    case SupportClick = 'support_click';

    /**
     * Events that cannot exist without a property: property_id is
     * required with them.
     *
     * @return array<int, self>
     */
    public static function requiringAProperty(): array
    {
        return [self::ListingView];
    }

    /**
     * Events that MAY say which property they happened on (a contact
     * click on a listing page, for instance). property_id is kept with
     * these and dropped from any other event, so a page_view can never
     * count as a listing view in the "top listings" table.
     *
     * @return array<int, self>
     */
    public static function aboutAProperty(): array
    {
        return [
            self::ListingView,
            self::ContactClick,
            self::PhoneRevealClick,
            self::BookingRequest,
            self::FavoriteAdd,
            self::ShareClick,
        ];
    }

    /** @return array<int, self> */
    public static function requiringARoommatePost(): array
    {
        return [self::RoommateView];
    }

    /** Same idea as aboutAProperty(), for roommate posts. @return array<int, self> */
    public static function aboutARoommatePost(): array
    {
        return [
            self::RoommateView,
            self::ContactClick,
            self::ShareClick,
        ];
    }
}
