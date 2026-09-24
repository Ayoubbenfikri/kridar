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
    myReservations: 'الحجوزات ديالي',
    ownerSpace: 'فضاء الملّاك',
    admin: 'الإدارة',
    favorites: 'المفضّلة ',
    account: 'الحساب ديالي',
    settings: 'الإعدادات',
    logout: 'خروج',
    loggingOut: 'خروج...',
    login: 'دخول',
    register: 'دير حساب',
    openMenu: 'حلّ القائمة',
    closeMenu: 'سدّ القائمة',
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
    rights: '© {{year}} Kridar. گاع الحقوق محفوظة.',
  },

  common: {
    close: 'اغلق',
    currency: 'درهم',
    backToHome: 'رجع للرئيسية',
  },

  propertyType: {
    all: 'جميع الأنواع',
    apartment: 'شقة',
    villa: 'فيلا',
    studio: 'ستوديو',
    riad: 'رياض',
    office: 'مكتب',
  },

  rentalType: {
    short_term: 'قصيرة المدة',
    long_term: 'مديدة المدة',
    both: 'قصيرة و طويلة',
  },

  price: {
    perNight: 'فـ الليلة',
    perMonth: 'فـ الشهر',
    notSet: 'الثمن ممحددش',
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
    destination: 'المكان',
    destinationPlaceholder: 'مراكش، الدار البيضاء...',
    propertyType: 'نوع الدار',
    guests: 'شحال ديال الناس',
    guestsPlaceholder: '2',
    submit: 'ابحث',
  },

  home: {
    badge: 'كراء قصير وطويل المدة فالمغرب',
    title: 'لقا الدار الجاية ديالك فالمغرب',
    subtitle:
      'شقق، فيلات ورياضات فمراكش، الدار البيضاء، الرباط وفين ما بغيتي. حجز مباشر مع المالك.',
    latest: 'آخر الديور',
    latestSubtitle: 'الديور لي تنشرو مؤخراً',
    seeAll: 'شوف كولشي',
    seeAllProperties: 'شوف گاع الديور',
    loadError:
      'load Error',
    emptyTitle: 'ماكاين حتى دار منشورة دابا',
    emptyDescription: 'الديور غادي يبانو هنا ملي شي مالك ينشر وحدة.',
    publishCta: 'نشر الدار ديالي',
    ownerTitle: 'عندك شي دار باش تكريها؟',
    ownerText: 'نشر الإعلان ديالك، دبّر المواعيد والحجوزات من بلاصة وحدة. بلا سمسار.',
    ownerCta: 'ولّي مالك',
  },

  properties: {
    title: 'گاع الديور',
    available: 'الديور المتاحة: {{n}}',
    loading: 'loading ...',
    serverDown: 'السيرفر ما كيجاوبش',
    searchPlaceholder: 'قلّب بالعنوان ولا بالمدينة...',
    searchLabel: 'قلّب',
    filters: 'الفلاتر',
    removeFilter: 'حيد هاد الفلتر',
    clearAll: 'مسح كلشي',
    loadError:'loading ERRor',
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
    reset: 'مسح كلشي',
  },

  auth: {
    loginTitle: 'مرحبا بيك من جديد',
    loginSubtitle: 'دخل باش تدبّر الحجوزات ديالك',
    registerTitle: 'دير حساب جديد',
    registerSubtitle: ' ثواني، وتقدر تحجز',

    email: 'الإيميل',
    emailPlaceholder: 'nta@exemple.com',
    password: 'كلمة السر',
    passwordHint: '8 حروف على الأقل',
    showPassword: 'اضهر كلمة السر',
    hidePassword: 'خبّي كلمة السر',

    fullName: 'الاسم الكامل',
    namePlaceholder: 'أيوب بنفكري',
    phone: 'التيليفون (اختياري)',
    phonePlaceholder: '+212 6 12 34 56 78',
    confirmPassword: 'عاود كلمة السر',
    passwordsDoNotMatch: 'كلمتين السر ماشي بحال بحال.',

    login: 'دخول',
    loggingIn: 'دخول...',
    register: 'دير حساب',
    registering: 'تسجيل...',
    noAccount: 'مازال ماعندكش حساب؟',
    haveAccount: 'عندك حساب؟',
  },
}
