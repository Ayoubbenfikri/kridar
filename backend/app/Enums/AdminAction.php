<?php

namespace App\Enums;

/**
 * Every admin action that gets written to admin_activity_logs.
 *
 * An enum rather than free-text strings so the log can be filtered and
 * labelled reliably: a typo in a string would create a silent second
 * category that no filter ever matches.
 *
 * Values are dotted and stable — they are stored in the database, so
 * renaming one rewrites history. Add cases, don't edit them.
 */
enum AdminAction: string
{
    case UserSuspended = 'user.suspended';
    case UserActivated = 'user.activated';
    case PropertyApproved = 'property.approved';
    case PropertySuspended = 'property.suspended';
    case SettingsUpdated = 'settings.updated';
}
