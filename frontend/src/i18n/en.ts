import type { TranslationSchema } from './fr'

/**
 * English.
 *
 * Typed as TranslationSchema, so a missing key or a typo'd one fails the
 * build instead of falling back to French at runtime in front of a user.
 */
export const en: TranslationSchema = {
  language: {
    label: 'Language',
    fr: 'Français',
    en: 'English',
    ary: 'الدارجة',
    frShort: 'FR',
    enShort: 'EN',
    aryShort: 'دارجة',
  },

  nav: {
    home: 'Home',
    properties: 'Properties',
    myReservations: 'My bookings',
    ownerSpace: 'Owner space',
    admin: 'Administration',
    favorites: 'My favourites',
    account: 'My account',
    settings: 'Settings',
    logout: 'Log out',
    loggingOut: 'Logging out...',
    login: 'Log in',
    register: 'Sign up',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    messages: 'Messages',
    messagesUnread: 'Messages ({{n}} unread)',
    notifications: 'Notifications',
    notificationsUnread: 'Notifications ({{n}} unread)',
  },

  footer: {
    tagline:
      'Short and long term rentals in Morocco. Book directly between travellers and owners.',
    explore: 'Explore',
    allProperties: 'All properties',
    mySpace: 'My space',
    rights: '© {{year}} Kridar. All rights reserved.',
  },

  common: {
    close: 'Close',
    currency: 'MAD',
    backToHome: 'Back to home',
  },

  propertyType: {
    all: 'All types',
    apartment: 'Apartment',
    villa: 'Villa',
    studio: 'Studio',
    riad: 'Riad',
    office: 'Office',
  },

  rentalType: {
    short_term: 'Short term',
    long_term: 'Long term',
    both: 'Short or long term',
  },

  price: {
    perNight: '/ night',
    perMonth: '/ month',
    notSet: 'Price not set',
  },

  card: {
    noPhoto: 'No photo',
    featured: 'Featured',
    bedrooms: '{{n}} bd',
    bathrooms: '{{n}} ba',
    guests: '{{n}} guests',
    area: '{{n}} m²',
  },

  search: {
    destination: 'Destination',
    destinationPlaceholder: 'Marrakech, Casablanca...',
    propertyType: 'Property type',
    guests: 'Guests',
    guestsPlaceholder: '2',
    submit: 'Search',
  },

  home: {
    badge: 'Short and long term rentals in Morocco',
    title: 'Find your next home in Morocco',
    subtitle:
      'Apartments, villas and riads in Marrakech, Casablanca, Rabat and everywhere else. Book directly with the owner.',
    latest: 'Latest listings',
    latestSubtitle: 'The most recently published properties',
    seeAll: 'See all',
    seeAllProperties: 'See all properties',
    loadError:
      'Could not load the listings right now. Check that the API is running (php artisan serve), then reload the page.',
    emptyTitle: 'Nothing published yet',
    emptyDescription: 'Listings will show up here as soon as an owner publishes one.',
    publishCta: 'List my property',
    ownerTitle: 'Got a place to rent out?',
    ownerText:
      'Publish your listing, manage your availability and your bookings from one place. No middleman.',
    ownerCta: 'Become an owner',
  },

  properties: {
    title: 'All properties',
    available: 'Listings available: {{n}}',
    loading: 'Loading listings...',
    serverDown: 'Server unreachable',
    searchPlaceholder: 'Search by title or city...',
    searchLabel: 'Search',
    filters: 'Filters',
    removeFilter: 'Remove this filter',
    clearAll: 'Clear all',
    loadError:
      'Could not load the listings. Check that the API is running (php artisan serve), then reload the page.',
    emptyTitle: 'Nothing matches',
    emptyDescription:
      'Try widening your search: fewer filters, a broader price range, or a different city.',
    clearFilters: 'Clear filters',
    pagination: 'Pagination',
    previous: 'Previous',
    next: 'Next',
    pageOf: 'Page {{current}} of {{last}}',
    chipMin: 'Min {{value}} {{currency}}',
    chipMax: 'Max {{value}} {{currency}}',
    chipBedrooms: '{{n}}+ bedrooms',
    chipBathrooms: '{{n}}+ bathrooms',
    chipGuests: '{{n}}+ guests',
    chipAmenity: 'Amenity {{id}}',
  },

  filters: {
    propertyType: 'Property type',
    rentalType: 'Rental length',
    minPrice: 'Min price ({{unit}})',
    maxPrice: 'Max price ({{unit}})',
    perMonth: 'per month',
    perNight: 'per night',
    noLimit: 'No limit',
    bedrooms: 'Bedrooms (at least)',
    bathrooms: 'Bathrooms (at least)',
    guests: 'Guests (at least)',
    any: 'Any',
    amenities: 'Amenities',
    amenitiesHint: 'A listing must have every ticked amenity to appear.',
    apply: 'Apply filters',
    reset: 'Clear all',
  },

  auth: {
    loginTitle: 'Welcome back',
    loginSubtitle: 'Log in to manage your bookings',
    registerTitle: 'Create an account',
    registerSubtitle: 'A few seconds, and you can book',

    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordHint: '8 characters minimum',
    showPassword: 'Show password',
    hidePassword: 'Hide password',

    fullName: 'Full name',
    namePlaceholder: 'Ayoub Benfikri',
    phone: 'Phone (optional)',
    phonePlaceholder: '+212 6 12 34 56 78',
    confirmPassword: 'Confirm password',
    passwordsDoNotMatch: 'The two passwords do not match.',

    login: 'Log in',
    loggingIn: 'Logging in...',
    register: 'Sign up',
    registering: 'Signing up...',
    noAccount: 'No account yet?',
    haveAccount: 'Already have an account?',
  },
}
