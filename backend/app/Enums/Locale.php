<?php

namespace App\Enums;

/**
 * The languages Kridar speaks (Phase 27).
 *
 * `ary` is the ISO 639-3 code for Moroccan Arabic — Darija. Not `ar`,
 * which is Modern Standard Arabic and a different language in practice,
 * and not `ar-MA`, which would say "Arabic as spoken in Morocco" and
 * make every MSA translation look like a valid fallback for Darija. The
 * code is also the directory name under backend/lang/ and the file name
 * under frontend/src/i18n/locales/, so the two sides cannot drift.
 *
 * This enum is the allowlist. Both the SetLocale middleware and
 * UpdateProfileRequest validate against it, so a request can never put
 * an arbitrary string into App::setLocale() or into users.locale.
 */
enum Locale: string
{
    case Fr = 'fr';
    case En = 'en';
    case Ary = 'ary';

    /**
     * Darija is written in Arabic script, so it reads right to left. This
     * is the single source of that fact — the frontend gets it from the
     * user's locale rather than keeping its own list.
     */
    public function isRtl(): bool
    {
        return $this === self::Ary;
    }

    /** For the dir attribute on <html>. */
    public function direction(): string
    {
        return $this->isRtl() ? 'rtl' : 'ltr';
    }

    /**
     * Kridar is a Moroccan product and French is what the interface was
     * written in, so it stays the fallback rather than English.
     */
    public static function default(): self
    {
        return self::Fr;
    }
}
