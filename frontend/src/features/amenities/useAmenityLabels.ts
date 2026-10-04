import { useTranslation } from 'react-i18next'

/**
 * Display names for amenities, in the current interface language.
 *
 * The amenities table stores ONE name per row, in English (see
 * backend/database/seeders/AmenitiesSeeder.php) — there is no column per
 * language, and adding one would mean a migration + a resource change for
 * 14 rows that basically never change. Instead, the translations live in
 * the i18n files (`amenityNames`, `amenityCategories`), looked up by the
 * English name the API sends.
 *
 * ⚠️ So the keys of `amenityNames` in fr.ts / en.ts / ary.ts must be
 * EXACTLY the names in AmenitiesSeeder. If someone adds a new amenity
 * (seeder, admin, tinker...) and forgets the translation, nothing breaks:
 * `defaultValue` makes it fall back to the raw name from the database,
 * which is a readable English word rather than a raw i18n key.
 *
 * Returns plain functions (not a precomputed map) because the language
 * can change while a page is open — useTranslation() re-renders the caller
 * when it does, and the functions below are called during that render.
 */
export function useAmenityLabels() {
  const { t } = useTranslation()

  function amenityName(name: string): string {
    return t(`amenityNames.${name}`, { defaultValue: name })
  }

  /** `category` is nullable in the database — null means "Other". */
  function categoryName(category: string | null): string {
    if (category === null) return t('amenityCategories.other')
    return t(`amenityCategories.${category}`, { defaultValue: category })
  }

  return { amenityName, categoryName }
}
