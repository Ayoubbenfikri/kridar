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
    roommates: 'Roommates',
    myReservations: 'bookings',
    ownerSpace: 'Owner space',
    admin: 'Administration',
    favorites: 'favourites',
    support: 'Support Krihouse',
    account: 'My account',
    settings: 'Settings',
    logout: 'Log out',
    loggingOut: 'Logging out...',
    login: 'Log in',
    register: 'Sign up',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Show sidebar',
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
    support: 'Support Krihouse',
    rights: '© {{year}} Krihouse. All rights reserved.',
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',
  },

  free: {
    badge: 'Free',
    publishFree: 'Publishing is free',
    noCommission: 'Krihouse takes no commission.',
    ownerNotice:
      'Krihouse is free for now: listing a property costs nothing, and no commission is taken from your rentals.',
  },

  support: {
    title: 'Support Krihouse',
    intro:
      'Krihouse is free, and it stays that way while I work out what the market actually needs. There is no investor and no budget behind it — just one developer in Marrakech.',
    whyTitle: 'Why I am asking',
    whyText:
      'A site has bills every month even when nobody pays to use it. A hand keeps the platform online and free for longer.',
    costsTitle: 'Where the money goes',
    costsText: 'Hosting, the domain name, email, and storing the photos.',
    donateButton: 'Donate',
    paypalTitle: 'PayPal',
    paypalText:
      'Pick an amount and pay on PayPal. Krihouse never sees your card or your PayPal login.',
    otherAmount: 'Another amount',
    bankTitle: 'Bank transfer',
    cryptoTitle: 'Crypto',
    contactTitle: 'Other ways to help',
    contactText:
      'Time, a translation, a bug report or donated hosting are worth as much as money.',
    copy: 'Copy',
    copied: 'Copied',
    noMethodsTitle: 'Nothing set up yet',
    noMethodsText:
      'No support method has been configured yet. Thanks for looking anyway — using Krihouse and telling people about it already helps.',
    thanks: 'Thank you. Really.',
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
    supportTitle: 'Krihouse is free',
    supportText:
      'No listing fee, no commission. If you like the project, you can help it grow.',
    supportCta: 'Support the project',
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
    viewList: 'List',
    viewMap: 'Map',
    mapLoading: 'Loading map...',
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

  // Keys are the exact names in AmenitiesSeeder — see fr.ts.
  amenityNames: {
    WiFi: 'WiFi',
    'Air conditioning': 'Air conditioning',
    Heating: 'Heating',
    Kitchen: 'Kitchen',
    'Washing machine': 'Washing machine',
    'Free parking': 'Free parking',
    Elevator: 'Elevator',
    'Swimming pool': 'Swimming pool',
    Terrace: 'Terrace',
    Garden: 'Garden',
    TV: 'TV',
    'Security / guard': 'Security / guard',
    'Smoke detector': 'Smoke detector',
    'Pets allowed': 'Pets allowed',
  },

  amenityCategories: {
    connectivity: 'Connectivity',
    comfort: 'Comfort',
    practical: 'Practical',
    outdoor: 'Outdoor',
    entertainment: 'Entertainment',
    safety: 'Safety',
    policy: 'House rules',
    other: 'Other',
  },

  roommateType: {
    all: 'All types',
    offer: 'Has a place, looking for a roommate',
    request: 'Looking for a place',
  },

  roommateCard: {
    noPhoto: 'No photo',
    perPerson: '/ person',
    perMonth: '/ month',
    beds: '{{n}} bed(s)',
    bedrooms: '{{n}} bd',
    priceNotSet: 'Price not set',
  },

  roommates: {
    title: 'Roommates',
    available: 'Posts available: {{n}}',
    loading: 'Loading posts...',
    serverDown: 'Server unreachable',
    searchPlaceholder: 'Search by title or city...',
    searchLabel: 'Search',
    filters: 'Filters',
    viewList: 'List',
    viewMap: 'Map',
    mapLoading: 'Loading map...',
    removeFilter: 'Remove this filter',
    clearAll: 'Clear all',
    loadError:
      'Could not load the posts. Check that the API is running (php artisan serve), then reload the page.',
    emptyTitle: 'Nothing matches',
    emptyDescription:
      'Try widening your search: fewer filters, a broader price range, or a different city.',
    clearFilters: 'Clear filters',
    previous: 'Previous',
    next: 'Next',
    pageOf: 'Page {{current}} of {{last}}',
    chipMin: 'Min {{value}} {{currency}}',
    chipMax: 'Max {{value}} {{currency}}',
    chipBeds: '{{n}}+ beds',
    chipBedrooms: '{{n}}+ bedrooms',
    chipFurnished: 'Furnished',
    chipAvailableBy: 'Available by {{date}}',
  },

  roommateFilters: {
    type: 'Post type',
    minPrice: 'Min price ({{unit}})',
    maxPrice: 'Max price ({{unit}})',
    perPerson: 'per person',
    noLimit: 'No limit',
    beds: 'Beds (at least)',
    bedrooms: 'Bedrooms (at least)',
    furnished: 'Furnished',
    furnishedAny: 'Any',
    furnishedYes: 'Furnished',
    furnishedNo: 'Not furnished',
    availableBy: 'Available by',
    any: 'Any',
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

    forgotPasswordLink: 'Forgot password?',
    forgotPasswordTitle: 'Reset your password',
    forgotPasswordSubtitle: "Enter your email and we'll send you a reset link",
    sendResetLink: 'Send reset link',
    sendingResetLink: 'Sending...',
    backToLogin: 'Back to log in',
    resetPasswordTitle: 'Choose a new password',
    resetPasswordSubtitle: 'Enter a new password for your account',
    newPassword: 'New password',
    resetPasswordSubmit: 'Reset password',
    resettingPassword: 'Resetting...',
    invalidResetLink: 'This reset link is invalid. Ask for a new one.',

    termsAcceptPrefix: 'I have read and accept the',
    termsOfUse: 'Terms of Use',
    termsAcceptMiddle: 'and the',
    privacyPolicy: 'Privacy Policy',

    continueWithGoogle: 'Continue with Google',
    orDivider: 'or',
    googleTermsPrefix: 'By continuing with Google, you accept our',

    googleErrorAuthFailed: 'Google sign-in failed. Please try again.',
    googleErrorEmailUnverified:
      "An account already exists with this email but isn't verified yet. Log in with your password, or verify your email, before using Google.",
    googleErrorAccountSuspended: 'This account has been suspended.',
  },

  legal: {
    modalTitle: 'Before you continue',
    modalIntro:
      'Please read and accept our Terms of Use and Privacy Policy to keep using Krihouse.',
    modalButton: 'I accept',
  },
}
