import type { TranslationSchema } from './fr'

/**
 * Darija (ary) — Moroccan Arabic in Arabic script.
 *
 * ⚠️ Ayoub: read these out loud. I wrote them to sound spoken rather than
 * like Modern Standard Arabic — "الحساب ديالي" instead of "حسابي",
 * "دير حساب" instead of "إنشاء حساب" — but you are the native speaker
 * and some of it will land wrong. Change any wording you like; only the
 * KEYS matter to the code, and TypeScript will tell you if you break one.
 *
 * Calls I am least sure about, in rough order:
 *
 *   nav.properties / properties.title → "الديور" (the houses). "العقارات"
 *   is the formal word but reads like a bank. Swap it if "الديور" feels
 *   too casual given the app also lists offices.
 *
 *   "گاع" (all) is very Moroccan and very spoken. "جميع" is the safe
 *   formal choice if the site should read more official.
 *
 *   card.bedrooms / card.bathrooms are abbreviations on a small card.
 *   I used "بيت" (room) and "حمام", which are the everyday words, but
 *   check they do not look cramped next to the icons.
 *
 *   search.destination → "لفين؟" (where to?) is friendlier than the
 *   literal "الوجهة". Your call which fits the brand.
 */
export const ary: TranslationSchema = {
  language: {
    label: 'اللغة',
    fr: 'Français',
    en: 'English',
    ary: 'الدارجة',
    frShort: 'FR',
    enShort: 'EN',
    aryShort: 'دارجة',
  },

  nav: {
    home: 'الرئيسية',
    properties: 'الديور',
    roommates: 'تقاسم السكن',
    myReservations: 'الحجوزات ديالي',
    ownerSpace: 'فضاء الملّاك',
    admin: 'الإدارة',
    favorites: 'المفضّلة ديالي',
    support: 'عاون Krihouse',
    account: 'الحساب ديالي',
    settings: 'الإعدادات',
    logout: 'خروج',
    loggingOut: 'كنخرجو...',
    login: 'دخول',
    register: 'دير حساب',
    openMenu: 'حلّ القائمة',
    closeMenu: 'سدّ القائمة',
    collapseSidebar: 'سدّ القائمة الجانبية',
    expandSidebar: 'بيّن القائمة الجانبية',
    messages: 'الرسائل',
    messagesUnread: 'الرسائل ({{n}} ما مقرّياش)',
    notifications: 'التنبيهات',
    notificationsUnread: 'التنبيهات ({{n}} جداد)',
  },

  footer: {
    tagline: 'كراء قصير ومديد المدة فالمغرب. حجز مباشر بين المسافرين والملّاك.',
    explore: 'تصفّح',
    allProperties: 'گاع الديور',
    mySpace: 'الفضاء ديالي',
    support: 'عاون Krihouse',
    rights: '© {{year}} Krihouse. گاع الحقوق محفوظة.',
    terms: 'شروط الاستعمال',
    privacy: 'سياسة الخصوصية',
  },

  free: {
    badge: 'بلا فلوس',
    publishFree: 'النشر بلا فلوس',
    noCommission: 'Krihouse ما كتاخدش حتى عمولة.',
    ownerNotice:
      'Krihouse دابا بلا فلوس: نشر الإعلان ما كيكلّفش شي حاجة، وما كناخدو حتى عمولة على الكراء ديالك.',
  },

  support: {
    title: 'عاون Krihouse',
    intro:
      'Krihouse بلا فلوس، وغادي يبقى هكاك حتى نفهم شنو محتاج السوق بجدّ. ماكاين لا مستثمر لا ميزانية: غير مطوّر واحد فمراكش.',
    whyTitle: 'علاش كنطلب المعاونة',
    whyText:
      'السيت عندو مصاريف كل شهر، حتى ملي حتى واحد ما كيخلّص. شي معاونة كتخلّي المنصة أونلاين وبلا فلوس مدة أطول.',
    costsTitle: 'فين كتمشي الفلوس',
    costsText: 'الهيبرجمون، اسم النطاق، الإيميلات، وتخزين التصاور.',
    donateButton: 'عاون',
    paypalTitle: 'PayPal',
    paypalText:
      'ختار شحال بغيتي، والخلاص كيتم فـ PayPal. Krihouse عمرو ما كيشوف المعلومات البنكية ديالك.',
    otherAmount: 'مبلغ آخر',
    bankTitle: 'تحويل بنكي',
    cryptoTitle: 'كريبتو',
    contactTitle: 'طرق أخرى للمعاونة',
    contactText: 'الوقت، ترجمة، بلاغ على شي مشكل، ولا هيبرجمون مجاني — كيسوى بحال الفلوس.',
    copy: 'كوپي',
    copied: 'تكوپيا',
    noMethodsTitle: 'مازال ماكاين تا شي حاجة',
    noMethodsText:
      'مازال ما تسجّلت تا طريقة للمعاونة. شكراً حتى هكاك — تستعمل Krihouse وتهضر عليه راه كيعاون بزاف.',
    thanks: 'شكراً. بجدّ.',
  },

  common: {
    close: 'سدّ',
    currency: 'درهم',
    backToHome: 'رجع للرئيسية',
  },

  propertyType: {
    all: 'گاع الأنواع',
    apartment: 'شقة',
    villa: 'فيلا',
    studio: 'ستوديو',
    riad: 'رياض',
    office: 'مكتب',
  },

  rentalType: {
    short_term: 'قصيرة المدة',
    long_term: 'مديدة المدة',
    both: 'قصيرة ولا مديدة',
  },

  price: {
    perNight: 'فـ الليلة',
    perMonth: 'فـ الشهر',
    notSet: 'الثمن ماشي محدّد',
  },

  card: {
    noPhoto: 'ما كاينة تا تصويرة',
    featured: 'مختارة',
    bedrooms: '{{n}} بيوت',
    bathrooms: '{{n}} حمامات',
    guests: '{{n}} ضياف',
    area: '{{n}} م²',
  },

  search: {
    destination: 'لفين؟',
    destinationPlaceholder: 'مراكش، الدار البيضاء...',
    propertyType: 'نوع الدار',
    guests: 'شحال ديال الناس',
    guestsPlaceholder: '2',
    submit: 'قلّب',
  },

  home: {
    badge: 'كراء قصير ومديد المدة فالمغرب',
    title: 'لقا الدار الجاية ديالك فالمغرب',
    subtitle:
      'شقق، فيلات ورياضات فمراكش، الدار البيضاء، الرباط وفين ما بغيتي. حجز مباشر مع المالك.',
    latest: 'آخر الديور',
    latestSubtitle: 'الديور لي تنشرو مؤخراً',
    seeAll: 'شوف گاع',
    seeAllProperties: 'شوف گاع الديور',
    loadError:
      'ما قدرناش نجيبو الديور دابا. تأكد بلي الـ API خدّام (php artisan serve)، من بعد عاود حمّل الصفحة.',
    emptyTitle: 'ماكاين حتى دار منشورة دابا',
    emptyDescription: 'الديور غادي يبانو هنا ملي شي مالك ينشر وحدة.',
    publishCta: 'نشر الدار ديالي',
    ownerTitle: 'عندك شي دار باش تكريها؟',
    ownerText: 'نشر الإعلان ديالك، دبّر المواعيد والحجوزات من بلاصة وحدة. بلا وسيط.',
    ownerCta: 'ولّي مالك',
    supportTitle: 'Krihouse بلا فلوس',
    supportText: 'لا فلوس النشر، لا عمولة. إلا عجبك المشروع، تقدر تعاونو يكبر.',
    supportCta: 'عاون المشروع',
  },

  properties: {
    title: 'گاع الديور',
    available: 'الديور المتاحة: {{n}}',
    loading: 'كنجيبو الديور...',
    serverDown: 'السيرفر ما كيجاوبش',
    searchPlaceholder: 'قلّب بالعنوان ولا بالمدينة...',
    searchLabel: 'قلّب',
    filters: 'الفلاتر',
    removeFilter: 'نحّي هاد الفلتر',
    clearAll: 'مسح گاع',
    loadError:
      'ما قدرناش نجيبو الديور. تأكد بلي الـ API خدّام (php artisan serve)، من بعد عاود حمّل الصفحة.',
    emptyTitle: 'ماكاين حتى دار مناسبة',
    emptyDescription: 'جرّب توسّع البحث: فلاتر أقل، ثمن أوسع، ولا مدينة أخرى.',
    clearFilters: 'مسح الفلاتر',
    pagination: 'الصفحات',
    previous: 'اللي قبل',
    next: 'اللي من بعد',
    pageOf: 'الصفحة {{current}} من {{last}}',
    chipMin: 'من {{value}} {{currency}}',
    chipMax: 'حتى {{value}} {{currency}}',
    chipBedrooms: '{{n}}+ بيوت',
    chipBathrooms: '{{n}}+ حمامات',
    chipGuests: '{{n}}+ ضياف',
    chipAmenity: 'تجهيز {{id}}',
    viewList: 'اللائحة',
    viewMap: 'الخريطة',
    mapLoading: 'كنجيبو الخريطة...',
  },

  filters: {
    propertyType: 'نوع الدار',
    rentalType: 'مدة الكراء',
    minPrice: 'أقل ثمن ({{unit}})',
    maxPrice: 'أكبر ثمن ({{unit}})',
    perMonth: 'فالشهر',
    perNight: 'فالليلة',
    noLimit: 'بلا حدّ',
    bedrooms: 'البيوت (على الأقل)',
    bathrooms: 'الحمامات (على الأقل)',
    guests: 'الضياف (على الأقل)',
    any: 'ما يهمّش',
    amenities: 'التجهيزات',
    amenitiesHint: 'خاص الدار يكونو فيها گاع التجهيزات لي خترتي باش تبان.',
    apply: 'طبّق الفلاتر',
    reset: 'مسح گاع',
  },

  // Keys are the exact names in AmenitiesSeeder — see fr.ts.
  // ⚠️ Ayoub: هاد الترجمات كتبتها بالدارجة اللي كتهضرو الناس فالمغرب
  // (الشوفاج، الكوزينة، البيسين، الأصانصور...) — بدّل أي كلمة ما عجباتكش.
  amenityNames: {
    WiFi: 'واي فاي',
    'Air conditioning': 'المكيّف',
    Heating: 'الشوفاج',
    Kitchen: 'الكوزينة',
    'Washing machine': 'ماشينة الغسيل',
    'Free parking': 'پاركينغ مجاني',
    Elevator: 'الأصانصور',
    'Swimming pool': 'البيسين',
    Terrace: 'التيراس',
    Garden: 'الجنان',
    TV: 'التلفازة',
    'Security / guard': 'الأمن / الحارس',
    'Smoke detector': 'كاشف الدخان',
    'Pets allowed': 'الحيوانات مقبولة',
  },

  amenityCategories: {
    connectivity: 'الاتصال',
    comfort: 'الراحة',
    practical: 'عملي',
    outdoor: 'برّا',
    entertainment: 'الترفيه',
    safety: 'السلامة',
    policy: 'قوانين الدار',
    other: 'أخرى',
  },

  // ⚠️ Ayoub: "roommates" (تقاسم السكن، حرفياً "تقسيم السكن") ماكاينش
  // ليه كلمة دارجة راسخة — كتبت حاجة مفهومة، بدّلها بلي كيعجبك.
  roommateType: {
    all: 'گاع الأنواع',
    offer: 'عندي بلاصة، كنقلّب على شريك',
    request: 'كنقلّب على بلاصة',
  },

  roommateCard: {
    noPhoto: 'ماكاينة تا تصويرة',
    perPerson: 'للفرد',
    perMonth: 'للشهر',
    beds: '{{n}} سرير',
    bedrooms: '{{n}} بيوت',
    priceNotSet: 'الثمن ماشي محدّد',
  },

  roommates: {
    title: 'تقاسم السكن',
    available: 'الإعلانات المتاحة: {{n}}',
    loading: 'كنجيبو الإعلانات...',
    serverDown: 'السيرفر ما كيجاوبش',
    searchPlaceholder: 'قلّب بالعنوان ولا بالمدينة...',
    searchLabel: 'قلّب',
    filters: 'الفلاتر',
    viewList: 'اللائحة',
    viewMap: 'الخريطة',
    mapLoading: 'كنجيبو الخريطة...',
    removeFilter: 'نحّي هاد الفلتر',
    clearAll: 'مسح گاع',
    loadError:
      'ما قدرناش نجيبو الإعلانات. تأكد بلي الـ API خدّام (php artisan serve)، من بعد عاود حمّل الصفحة.',
    emptyTitle: 'ماكاين حتى إعلان مناسب',
    emptyDescription: 'جرّب توسّع البحث: فلاتر أقل، ثمن أوسع، ولا مدينة أخرى.',
    clearFilters: 'مسح الفلاتر',
    previous: 'اللي قبل',
    next: 'اللي من بعد',
    pageOf: 'الصفحة {{current}} من {{last}}',
    chipMin: 'من {{value}} {{currency}}',
    chipMax: 'حتى {{value}} {{currency}}',
    chipBeds: '{{n}}+ سراير',
    chipBedrooms: '{{n}}+ بيوت',
    chipFurnished: 'مفروشة',
    chipAvailableBy: 'متاحة قبل {{date}}',
  },

  roommateFilters: {
    type: 'نوع الإعلان',
    minPrice: 'أقل ثمن ({{unit}})',
    maxPrice: 'أكبر ثمن ({{unit}})',
    perPerson: 'للفرد',
    noLimit: 'بلا حدّ',
    beds: 'السراير (على الأقل)',
    bedrooms: 'البيوت (على الأقل)',
    furnished: 'مفروشة',
    furnishedAny: 'ما يهمّش',
    furnishedYes: 'مفروشة',
    furnishedNo: 'ماشي مفروشة',
    availableBy: 'متاحة قبل',
    any: 'ما يهمّش',
    apply: 'طبّق الفلاتر',
    reset: 'مسح گاع',
  },

  auth: {
    loginTitle: 'مرحبا بيك من جديد',
    loginSubtitle: 'دخل باش تدبّر الحجوزات ديالك',
    registerTitle: 'دير حساب جديد',
    registerSubtitle: 'شي ثواني، وتقدر تحجز',

    email: 'الإيميل',
    emailPlaceholder: 'nta@exemple.com',
    password: 'كلمة السر',
    passwordHint: '8 حروف على الأقل',
    showPassword: 'وري كلمة السر',
    hidePassword: 'خبّي كلمة السر',

    fullName: 'الاسم الكامل',
    namePlaceholder: 'أيوب بنفقري',
    phone: 'التيليفون (اختياري)',
    phonePlaceholder: '+212 6 12 34 56 78',
    confirmPassword: 'عاود كلمة السر',
    passwordsDoNotMatch: 'كلمتين السر ماشي بحال بحال.',

    login: 'دخول',
    loggingIn: 'كندخلو...',
    register: 'دير حساب',
    registering: 'كنسجلو...',
    noAccount: 'مازال ماعندكش حساب؟',
    haveAccount: 'عندك حساب؟',

    forgotPasswordLink: 'نسيتي كلمة السر؟',
    forgotPasswordTitle: 'بدّل كلمة السر ديالك',
    forgotPasswordSubtitle: 'دخل الإيميل ديالك وغادي نصيفطو ليك رابط باش تبدّلها',
    sendResetLink: 'صيفط الرابط',
    sendingResetLink: 'كنصيفطو...',
    backToLogin: 'رجع لتسجيل الدخول',
    resetPasswordTitle: 'اختار كلمة سر جديدة',
    resetPasswordSubtitle: 'دخل كلمة سر جديدة للحساب ديالك',
    newPassword: 'كلمة السر الجديدة',
    resetPasswordSubmit: 'بدّل كلمة السر',
    resettingPassword: 'كنبدّلو...',
    invalidResetLink: 'هاد الرابط ماشي صالح. طلب واحد جديد.',

    termsAcceptPrefix: 'قريت وقبلت',
    termsOfUse: 'شروط الاستعمال',
    termsAcceptMiddle: 'و',
    privacyPolicy: 'سياسة الخصوصية',

    continueWithGoogle: 'كمّل ب Google',
    orDivider: 'ولا',
    googleTermsPrefix: 'إلا كملتي ب Google، كتقبل',

    googleErrorAuthFailed: 'الدخول ب Google ماخدمش. عاود المحاولة.',
    googleErrorEmailUnverified:
      'كاين ديجا حساب بهاد الإيميل ولكن مازال ماتأكدش. دخل بكلمة السر ديالك، ولا أكّد الإيميل ديالك، قبل ما تستعمل Google.',
    googleErrorAccountSuspended: 'هاد الحساب موقوف.',
  },

  legal: {
    modalTitle: 'قبل ما تكمل',
    modalIntro: 'خاصك تقرا وتقبل شروط الاستعمال وسياسة الخصوصية ديالنا باش تكمل تستعمل Krihouse.',
    modalButton: 'قبلت',
  },
}
