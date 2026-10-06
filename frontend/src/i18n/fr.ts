/**
 * French — the reference translation.
 *
 * This file defines the SHAPE. `TranslationSchema` below is derived from
 * it, and en.ts / ary.ts are typed against that schema, so a key you add
 * here and forget to translate is a `tsc` error rather than a French
 * sentence that quietly ships to an English user. Run
 * `npx tsc --noEmit -p tsconfig.app.json` after editing any of the three.
 *
 * These are .ts files rather than .json on purpose: the compile-time
 * check above needs types, and a translation file is exactly the place
 * you want to leave a comment explaining a word choice.
 *
 * 27A covered the shell (navbar, footer, form controls). 27B adds the
 * browse path and auth. The property details page, the account area,
 * owner and admin are still hardcoded French.
 *
 * NO PLURAL FORMS ANYWHERE. Counts are phrased so one form works for any
 * number — "Logements disponibles : 1" rather than "1 logement
 * disponible" — because i18next's plural machinery keys off
 * Intl.PluralRules, which does not know 'ary', and Arabic has six plural
 * categories anyway. Rephrasing costs nothing and cannot silently render
 * a raw key.
 */
export const fr = {
  language: {
    label: 'Langue',
    // A language is always named in its own language, so these three
    // lines are identical in all three files. That is correct, not a
    // copy-paste mistake: "English" is called English in Paris too.
    fr: 'Français',
    en: 'English',
    ary: 'الدارجة',
    // Short forms for the segmented control in the navbar.
    frShort: 'FR',
    enShort: 'EN',
    aryShort: 'دارجة',
  },

  nav: {
    home: 'Accueil',
    properties: 'Propriétés',
    // The two modes of the property list: /properties and /buy.
    rent: 'Louer',
    buy: 'Acheter',
    // Same word as roommates.title (Phase R5) — one term for this
    // feature across the whole site, not a second name in the nav.
    roommates: 'Colocations',
    myReservations: 'réservations',
    ownerSpace: 'Espace propriétaire',
    admin: 'Administration',
    favorites: 'Mes favoris',
    support: 'Soutenir Krihouse',
    account: 'Mon compte',
    settings: 'Paramètres',
    logout: 'Se déconnecter',
    loggingOut: 'Déconnexion...',
    login: 'Connexion',
    register: "S'inscrire",
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    // The sidebar show/hide toggle (nav redesign) - separate from
    // openMenu/closeMenu above, which are the mobile hamburger.
    collapseSidebar: 'Réduire le menu',
    expandSidebar: 'Afficher le menu',
    messages: 'Messages',
    // {{n}} and not {{count}} on purpose. `count` switches on i18next's
    // plural machinery, and Arabic has six plural forms — far more
    // ceremony than a number in brackets deserves.
    messagesUnread: 'Messages ({{n}} non lus)',
    notifications: 'Notifications',
    notificationsUnread: 'Notifications ({{n}} non lues)',
  },

  footer: {
    tagline:
      'Location courte et longue durée au Maroc. Réservation directe entre voyageurs et propriétaires.',
    explore: 'Explorer',
    allProperties: 'Toutes les propriétés',
    mySpace: 'Mon espace',
    support: 'Soutenir Krihouse',
    rights: '© {{year}} Krihouse. Tous droits réservés.',
    terms: "Conditions d'Utilisation",
    privacy: 'Politique de Confidentialité',
  },

  /**
   * Free mode (Phase 28). Shown wherever a price used to be, while
   * payments_enabled is false. Said out loud rather than hidden: free is
   * the strongest argument Krihouse has before it has any reviews.
   */
  free: {
    badge: 'Gratuit',
    publishFree: 'Publication gratuite',
    noCommission: 'Krihouse ne prend aucune commission.',
    ownerNotice:
      "Krihouse est gratuit pour le moment : publier une annonce ne coûte rien, et aucune commission n'est prélevée sur vos locations.",
  },

  support: {
    title: 'Soutenir Krihouse',
    intro:
      "Krihouse est gratuit, et le restera le temps de comprendre ce dont le marché a vraiment besoin. Il n'y a ni investisseur ni budget derrière : juste un développeur à Marrakech.",
    whyTitle: "Pourquoi je demande de l'aide",
    whyText:
      "Un site a des frais qui tombent chaque mois, même quand personne ne paie pour l'utiliser. Un coup de main permet de garder la plateforme en ligne et gratuite plus longtemps.",
    costsTitle: "À quoi sert l'argent",
    costsText: "L'hébergement, le nom de domaine, les emails, et le stockage des photos.",
    donateButton: 'Faire un don',
    paypalTitle: 'PayPal',
    paypalText:
      'Choisissez un montant, le paiement se fait sur PayPal. Krihouse ne voit jamais vos informations bancaires.',
    otherAmount: 'Un autre montant',
    bankTitle: 'Virement bancaire',
    cryptoTitle: 'Crypto',
    contactTitle: 'Aider autrement',
    contactText:
      "Du temps, une traduction, un bug signalé ou un hébergement offert valent autant qu'un don.",
    copy: 'Copier',
    copied: 'Copié',
    noMethodsTitle: 'Rien de configuré pour le moment',
    noMethodsText:
      "Aucun moyen de soutien n'est encore renseigné. Merci quand même d'être passé — utiliser Krihouse et en parler aide déjà.",
    thanks: 'Merci. Sincèrement.',
  },

  common: {
    close: 'Fermer',
    /** Appended to every price. Krihouse only ever prices in dirhams. */
    currency: 'MAD',
    backToHome: "Retour à l'accueil",
    edit: 'Modifier',
    add: 'Ajouter',
    city: 'Ville',
    status: 'Statut',
    publish: 'Publier',
    unpublish: 'Dépublier',
    seeAll: 'Voir tout',
    cancel: 'Annuler',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
  },

  propertyType: {
    all: 'Tous les types',
    apartment: 'Appartement',
    villa: 'Villa',
    studio: 'Studio',
    riad: 'Riad',
    office: 'Bureau',
    land: 'Terrain',
    commercial: 'Local commercial',
  },

  rentalType: {
    short_term: 'Courte durée',
    long_term: 'Longue durée',
    both: 'Courte ou longue durée',
  },

  price: {
    // Whole phrases, not just the unit word. In Darija the separator is
    // not a slash, and building "/ " + unit in JSX would force one.
    perNight: '/ nuit',
    perMonth: '/ mois',
    notSet: 'Prix non défini',
  },

  card: {
    noPhoto: 'Pas de photo',
    featured: 'Coup de cœur',
    bedrooms: '{{n}} ch.',
    bathrooms: '{{n}} sdb',
    guests: '{{n}} pers.',
    area: '{{n}} m²',
    negotiable: 'Négociable',
  },

  search: {
    destination: 'Destination',
    destinationPlaceholder: 'Marrakech, Casablanca...',
    propertyType: 'Type de logement',
    guests: 'Voyageurs',
    guestsPlaceholder: '2',
    submit: 'Rechercher',
    modeLabel: 'Type de recherche',
    modeShort: 'Séjour court',
    modeLong: 'Location longue',
    modeBuy: 'Acheter',
    budget: 'Budget',
    budgetMonth: 'Budget / mois',
    budgetMin: 'Min',
    budgetMax: 'Max',
    budgetAny: 'Peu importe',
    budgetClear: 'Effacer',
    budgetDone: 'OK',
    typesTitle: 'Explorer par type',
    typesSubtitle: 'Un clic pour voir tous les biens de ce type',
    saleTitle: 'Biens à vendre',
    saleSubtitle: 'Appartements, villas, terrains et locaux à acheter',
    seeAllSales: 'Voir les ventes',
  },

  home: {
    badge: 'Location et achat au Maroc',
    title: 'Trouvez votre prochain logement au Maroc',
    subtitle:
      'Appartements, villas et riads à Marrakech, Casablanca, Rabat et partout ailleurs. Réservation directe avec le propriétaire.',
    latest: 'Derniers logements',
    latestSubtitle: 'Les propriétés publiées le plus récemment',
    seeAll: 'Voir tout',
    seeAllProperties: 'Voir toutes les propriétés',
    loadError:
      "Impossible de charger les propriétés pour le moment. Vérifie que l'API tourne (php artisan serve), puis recharge la page.",
    emptyTitle: 'Aucun logement publié pour le moment',
    emptyDescription: "Les propriétés apparaîtront ici dès qu'un propriétaire en publiera une.",
    publishCta: 'Publier mon logement',
    ownerTitle: 'Vous avez un logement à louer ?',
    ownerText:
      'Publiez votre annonce, gérez vos disponibilités et vos réservations depuis un seul espace. Sans intermédiaire.',
    ownerCta: 'Devenir propriétaire',
    supportTitle: 'Krihouse est gratuit',
    supportText:
      "Pas de frais de publication, pas de commission. Si le projet vous plaît, vous pouvez l'aider à grandir.",
    supportCta: 'Soutenir le projet',
  },

  properties: {
    title: 'Toutes les propriétés',
    // Count as a suffix, so one phrasing works for 0, 1 and 200.
    available: 'Logements disponibles : {{n}}',
    loading: 'Chargement des logements...',
    serverDown: 'Serveur injoignable',
    searchPlaceholder: 'Rechercher par titre ou ville...',
    searchLabel: 'Rechercher',
    filters: 'Filtres',
    removeFilter: 'Retirer ce filtre',
    clearAll: 'Tout effacer',
    loadError:
      "Impossible de charger les propriétés. Vérifie que l'API tourne (php artisan serve), puis recharge la page.",
    emptyTitle: 'Aucun logement ne correspond',
    emptyDescription:
      "Essaie d'élargir ta recherche : moins de filtres, une fourchette de prix plus large, ou une autre ville.",
    clearFilters: 'Effacer les filtres',
    pagination: 'Pagination',
    previous: 'Précédent',
    next: 'Suivant',
    pageOf: 'Page {{current}} / {{last}}',
    chipMin: 'Min {{value}} {{currency}}',
    chipMax: 'Max {{value}} {{currency}}',
    chipBedrooms: '{{n}}+ chambres',
    chipBathrooms: '{{n}}+ sdb',
    chipGuests: '{{n}}+ voyageurs',
    chipAmenity: 'Équipement {{id}}',
    viewList: 'Liste',
    viewMap: 'Carte',
    mapLoading: 'Chargement de la carte...',
    // The sale mode (/buy) of the same page.
    modeLabel: "Type d'annonce",
    saleTitle: 'Biens à vendre',
    saleAvailable: 'Biens disponibles : {{n}}',
    saleLoading: 'Chargement des biens...',
    saleEmptyTitle: 'Aucun bien ne correspond',
  },

  // One-click filters above the property list (QuickFilters).
  quick: {
    type: 'Type',
    duration: 'Durée',
    priceNight: 'Prix / nuit',
    priceMonth: 'Prix / mois',
    priceSale: 'Prix',
    bedrooms: 'Chambres',
    sort: 'Trier',
    sortNewest: 'Plus récents',
    sortPriceAsc: 'Prix croissant',
    sortPriceDesc: 'Prix décroissant',
  },

  filters: {
    propertyType: 'Type de logement',
    rentalType: 'Durée de location',
    price: 'Prix ({{unit}})',
    minPrice: 'Prix min ({{unit}})',
    maxPrice: 'Prix max ({{unit}})',
    perMonth: 'par mois',
    perNight: 'par nuit',
    noLimit: 'Sans limite',
    bedrooms: 'Chambres (au moins)',
    bathrooms: 'Salles de bain (au moins)',
    guests: 'Voyageurs (au moins)',
    any: 'Peu importe',
    amenities: 'Équipements',
    amenitiesHint: 'Un logement doit avoir tous les équipements cochés pour apparaître.',
    apply: 'Appliquer les filtres',
    reset: 'Tout effacer',
  },

  // Amenity names and categories. The database stores one English name
  // per amenity (AmenitiesSeeder), so these are looked up BY that English
  // name through useAmenityLabels(). The keys below must match the seeder
  // names exactly; an amenity with no entry here simply shows its English
  // name (see useAmenityLabels for the fallback).
  amenityNames: {
    WiFi: 'Wi-Fi',
    'Air conditioning': 'Climatisation',
    Heating: 'Chauffage',
    Kitchen: 'Cuisine',
    'Washing machine': 'Lave-linge',
    'Free parking': 'Parking gratuit',
    Elevator: 'Ascenseur',
    'Swimming pool': 'Piscine',
    Terrace: 'Terrasse',
    Garden: 'Jardin',
    TV: 'Télévision',
    'Security / guard': 'Sécurité / gardien',
    'Smoke detector': 'Détecteur de fumée',
    'Pets allowed': 'Animaux acceptés',
  },

  amenityCategories: {
    connectivity: 'Connectivité',
    comfort: 'Confort',
    practical: 'Pratique',
    outdoor: 'Extérieur',
    entertainment: 'Divertissement',
    safety: 'Sécurité',
    policy: 'Règles de la maison',
    other: 'Autres',
  },

  // Shared Accommodation / Roommates (Phase R5). Same i18n treatment as
  // `properties`/`filters`/`card`/`propertyType` above — this is a public
  // browse path, same as the property list. The roommate details page
  // stays hardcoded French for now, same debt as PropertyDetailsPage
  // (see the note at the top of this file).
  roommateType: {
    all: 'Tous les types',
    offer: 'Cherche colocataire',
    request: 'Cherche logement',
  },

  roommateCard: {
    noPhoto: 'Pas de photo',
    perPerson: '/ personne',
    perMonth: '/ mois',
    beds: '{{n}} lit(s)',
    bedrooms: '{{n}} ch.',
    priceNotSet: 'Prix non défini',
  },

  roommates: {
    title: 'Colocations',
    available: 'Annonces disponibles : {{n}}',
    loading: 'Chargement des annonces...',
    serverDown: 'Serveur injoignable',
    searchPlaceholder: 'Rechercher par titre ou ville...',
    searchLabel: 'Rechercher',
    filters: 'Filtres',
    viewList: 'Liste',
    viewMap: 'Carte',
    mapLoading: 'Chargement de la carte...',
    removeFilter: 'Retirer ce filtre',
    clearAll: 'Tout effacer',
    loadError:
      "Impossible de charger les annonces. Vérifie que l'API tourne (php artisan serve), puis recharge la page.",
    emptyTitle: 'Aucune annonce ne correspond',
    emptyDescription:
      "Essaie d'élargir ta recherche : moins de filtres, une fourchette de prix plus large, ou une autre ville.",
    clearFilters: 'Effacer les filtres',
    previous: 'Précédent',
    next: 'Suivant',
    pageOf: 'Page {{current}} / {{last}}',
    chipMin: 'Min {{value}} {{currency}}',
    chipMax: 'Max {{value}} {{currency}}',
    chipBeds: '{{n}}+ lits',
    chipBedrooms: '{{n}}+ chambres',
    chipFurnished: 'Meublé',
    chipAvailableBy: 'Disponible avant le {{date}}',
  },

  roommateFilters: {
    type: "Type d'annonce",
    minPrice: 'Prix min ({{unit}})',
    maxPrice: 'Prix max ({{unit}})',
    perPerson: 'par personne',
    noLimit: 'Sans limite',
    beds: 'Lits (au moins)',
    bedrooms: 'Chambres (au moins)',
    furnished: 'Meublé',
    furnishedAny: 'Peu importe',
    furnishedYes: 'Meublé',
    furnishedNo: 'Non meublé',
    availableBy: 'Disponible avant le',
    any: 'Peu importe',
    apply: 'Appliquer les filtres',
    reset: 'Tout effacer',
  },

  auth: {
    loginTitle: 'Content de vous revoir',
    loginSubtitle: 'Connectez-vous pour gérer vos réservations',
    registerTitle: 'Créer un compte',
    registerSubtitle: 'Quelques secondes, et vous pouvez réserver',

    email: 'Email',
    emailPlaceholder: 'vous@exemple.com',
    password: 'Mot de passe',
    passwordHint: '8 caractères minimum',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',

    fullName: 'Nom complet',
    namePlaceholder: 'Ayoub Benfikri',
    phone: 'Téléphone (optionnel)',
    phonePlaceholder: '+212 6 12 34 56 78',
    confirmPassword: 'Confirmer le mot de passe',
    passwordsDoNotMatch: 'Les deux mots de passe ne correspondent pas.',

    login: 'Se connecter',
    loggingIn: 'Connexion...',
    register: "S'inscrire",
    registering: 'Inscription...',
    noAccount: 'Pas encore de compte ?',
    haveAccount: 'Déjà un compte ?',

    forgotPasswordLink: 'Mot de passe oublié ?',
    forgotPasswordTitle: 'Réinitialiser votre mot de passe',
    forgotPasswordSubtitle: "Entrez votre email, on vous envoie un lien de réinitialisation",
    sendResetLink: 'Envoyer le lien',
    sendingResetLink: 'Envoi...',
    backToLogin: 'Retour à la connexion',
    resetPasswordTitle: 'Choisissez un nouveau mot de passe',
    resetPasswordSubtitle: 'Entrez un nouveau mot de passe pour votre compte',
    newPassword: 'Nouveau mot de passe',
    resetPasswordSubmit: 'Réinitialiser le mot de passe',
    resettingPassword: 'Réinitialisation...',
    // Shown instead of the form when the link is opened without its
    // token/email query string (typed by hand, forwarded and stripped by
    // an email client, etc.) - nothing to submit, so this is caught
    // before the backend ever sees the request.
    invalidResetLink: 'Ce lien de réinitialisation est invalide. Demandez-en un nouveau.',

    // The registration-form checkbox, built as prefix + two links + middle
    // word rather than one long string with placeholders - same pattern as
    // "haveAccount" above (text + a real <Link>, not an interpolated URL).
    // Reused as-is inside AcceptTermsModal's two reading links.
    termsAcceptPrefix: "J'ai lu et j'accepte les",
    termsOfUse: "Conditions d'Utilisation",
    termsAcceptMiddle: 'et la',
    privacyPolicy: 'Politique de Confidentialité',

    // "Connect with Google" (GoogleAuthButton, shown on /login and
    // /register). The button itself is a plain <a href> to the backend's
    // /auth/google/redirect - no mutation, no loading state, the browser
    // just navigates away.
    continueWithGoogle: 'Continuer avec Google',
    orDivider: 'ou',
    // Same prefix/middle/link pattern as termsAcceptPrefix above, but
    // informational rather than a checkbox: clicking the Google button IS
    // the acceptance (terms_accepted_at is stamped automatically in
    // GoogleAuthController), so this is a notice, not a required field.
    googleTermsPrefix: 'En continuant avec Google, vous acceptez nos',

    // GoogleAuthController redirects back to /login?error=<code> for every
    // failure case (consent cancelled, Google error, an unverified classic
    // account with the same email, a suspended account) - LoginForm reads
    // that query param once on mount and shows one of these as a toast.
    googleErrorAuthFailed: 'La connexion avec Google a échoué. Réessayez.',
    googleErrorEmailUnverified:
      'Un compte existe déjà avec cet email mais n\'est pas encore vérifié. Connectez-vous avec votre mot de passe, ou vérifiez votre email, avant d\'utiliser Google.',
    googleErrorAccountSuspended: 'Ce compte a été suspendu.',
  },

  // AcceptTermsModal only (frontend/src/components/legal/). The two legal
  // pages themselves are hardcoded French for now, same as the property
  // details/account/owner/admin pages - not worth maintaining in three
  // languages while the wording is still an unreviewed draft (see the
  // notice banner on TermsOfUsePage/PrivacyPolicyPage).
  legal: {
    modalTitle: 'Avant de continuer',
    modalIntro:
      "Merci de lire et d'accepter nos Conditions d'Utilisation et notre Politique de Confidentialité pour continuer à utiliser Krihouse.",
    modalButton: "J'accepte",
  },

  errors: {
    generic: 'Une erreur est survenue. Réessayez.',
  },

  // Owner area (/owner/*): the layout, the dashboard and the two lists.
  owner: {
    nav: {
      label: 'Propriétaire',
      dashboard: 'Tableau de bord',
      properties: 'Mes propriétés',
      roommates: 'Mes colocations',
      reservations: 'Réservations',
    },
    dashboard: {
      title: 'Espace propriétaire',
      subtitle: "Vue d'ensemble de votre activité",
      properties: 'Propriétés',
      published: 'Publiées',
      pendingRequests: 'Demandes en attente',
      netRevenue: 'Revenu net',
      afterCommission: 'Après {{amount}} de commission Krihouse',
      noCommission: 'Aucune commission prélevée',
      totalReservations: 'Réservations au total',
      completedStays: 'Séjours terminés',
      reviews: 'Avis : {{n}}',
      pendingTitle: 'Demandes en attente',
      noPending: 'Aucune demande en attente pour le moment.',
      guestFallback: 'Client',
      dateRange: '{{start}} au {{end}}',
    },
    properties: {
      title: 'Mes propriétés',
      count: 'Propriétés : {{n}}',
      emptyTitle: 'Aucune propriété pour le moment',
      emptyDescription: 'Publiez votre premier logement pour commencer à recevoir des réservations.',
      addProperty: 'Ajouter une propriété',
      columnProperty: 'Propriété',
      columnPrice: 'Prix',
      // Keyed by the backend status value (PropertyStatusValue).
      status: {
        draft: 'Brouillon',
        pending_review: 'En révision',
        published: 'Publiée',
        suspended: 'Suspendue',
        archived: 'Archivée',
      },
      forSale: 'À vendre',
      unpaid: 'Publication non payée',
      unpaidShort: 'Non payée',
      suspendedShort: 'Suspendue',
      suspendedByAdmin: 'Suspendue par un admin',
      suspendedHint: 'Seul un administrateur peut lever une suspension',
      pay: 'Payer {{amount}}',
      payFees: 'Payer les frais',
      editLabel: 'Modifier {{title}}',
      unpublishedToast: '"{{title}}" n\'est plus visible publiquement.',
      publishedToast: '"{{title}}" est maintenant publiée.',
      freePublishedToast: 'Publication gratuite — "{{title}}" est en ligne.',
    },
    roommates: {
      title: 'Mes colocations',
      count: 'Posts : {{n}}',
      emptyTitle: 'Aucun post pour le moment',
      emptyDescription: 'Publiez une annonce pour trouver un colocataire ou une place à partager.',
      addPost: 'Ajouter un post',
      columnPost: 'Post',
      columnType: 'Type',
      // Keyed by the backend status / type value.
      status: {
        draft: 'Brouillon',
        published: 'Publié',
        suspended: 'Suspendu',
        archived: 'Archivé',
      },
      type: {
        offer: 'Offre',
        request: 'Recherche',
      },
      archivedHint: 'Seul un administrateur peut lever une archive',
      suspendedHint: 'Suspendu par un administrateur — contactez le support',
      unpublishedToast: '"{{title}}" n\'est plus visible publiquement.',
      publishedToast: '"{{title}}" est maintenant publié.',
    },
  },

  // My reservations (/reservations): the guest's own bookings.
  reservationStatus: {
    pending: 'En attente',
    confirmed: 'Confirmée',
    rejected: 'Refusée',
    cancelled: 'Annulée',
    completed: 'Terminée',
  },

  reservations: {
    title: 'Mes réservations',
    count: 'Réservations : {{n}}',
    loadError: 'Impossible de charger vos réservations.',
    emptyTitle: 'Aucune réservation',
    emptyDescription: 'Vos demandes et séjours apparaîtront ici une fois une réservation envoyée.',
    browse: 'Parcourir les propriétés',
    arrival: 'Arrivée',
    departure: 'Départ',
    total: 'Total',
    cancellationReason: "Motif d'annulation : {{reason}}",
    pay: 'Payer {{amount}}',
    paid: 'Payé',
    leaveReview: 'Laisser un avis',
    cancel: 'Annuler',
    cancelReasonLabel: "Motif de l'annulation (optionnel)",
    confirmCancel: "Confirmer l'annulation",
    back: 'Retour',
  },

  favorites: {
    title: 'Mes favoris',
    count: 'Logements sauvegardés : {{n}}',
    loadError: 'Impossible de charger vos favoris.',
    emptyTitle: 'Aucun favori pour le moment',
    emptyDescription: 'Touchez le cœur sur un logement pour le retrouver ici.',
  },

  // Inbox (/messages) - the list column and the empty right-hand pane.
  messages: {
    title: 'Messages',
    count: 'Conversations : {{n}}',
    pickConversation: "Sélectionnez une conversation pour l'ouvrir.",
    userFallback: 'Utilisateur',
    listingDeleted: 'Annonce supprimée',
    aboutYourListing: 'À propos de votre annonce',
    yourRequest: 'Votre demande',
    emptyTitle: 'Aucune conversation',
    emptyDescription: "Contactez un propriétaire depuis la page d'une annonce pour démarrer une conversation.",
    browse: 'Parcourir les propriétés',
  },

  // The notifications page. The BACKEND stores a French `message` in every
  // notification (see App\Notifications\*), so the page builds its own
  // sentence from the notification's type + data in the current language
  // (lib/notificationMessage.ts) and only falls back to that stored text
  // for a notification it does not know.
  notifications: {
    title: 'Notifications',
    markAllRead: 'Tout marquer comme lu',
    markAllReadToast: 'Toutes les notifications sont marquées comme lues.',
    markRead: 'Marquer comme lu',
    loadError: 'Impossible de charger vos notifications.',
    emptyTitle: 'Aucune notification',
    emptyDescription: 'Vous serez prévenu ici des confirmations, annulations et nouveaux avis.',
    message: {
      new_message: '{{sender}} vous a envoyé un message à propos de "{{title}}".',
      reservation_requested: 'Nouvelle demande de réservation pour "{{title}}".',
      reservation_confirmed: 'Votre réservation pour "{{title}}" a été confirmée.',
      reservation_rejected: 'Votre demande de réservation pour "{{title}}" a été refusée.',
      reservation_cancelled_by_guest: 'La réservation pour "{{title}}" a été annulée par le voyageur.',
      reservation_cancelled_by_owner: 'La réservation pour "{{title}}" a été annulée par le propriétaire.',
      review_submitted: 'Vous avez reçu un nouvel avis ({{rating}}/5) pour "{{title}}".',
      review_replied: 'Le propriétaire a répondu à votre avis sur "{{title}}".',
    },
  },

  account: {
    greeting: 'Bonjour {{name}}',
    settings: 'Paramètres',
    reservations: 'Réservations',
    favorites: 'Favoris',
    unreadNotifications: 'Notifications non lues',
    upcoming: 'Prochaines réservations',
    noUpcoming: 'Aucune réservation en attente ou confirmée pour le moment.',
    dateRange: '{{start}} au {{end}}',
  },

  accountSettings: {
    back: 'Mon compte',
    title: 'Paramètres',
    subtitle: 'Vos informations et votre mot de passe',
    avatar: {
      title: 'Photo de profil',
      description: 'Visible par les autres dans vos messages et sur vos annonces.',
      change: 'Changer la photo',
      add: 'Ajouter une photo',
      remove: 'Retirer',
      hint: 'JPEG, PNG ou WebP. 2 Mo maximum.',
      unsupportedFormat: 'Format non supporté. Utilisez une image JPEG, PNG ou WebP.',
      tooLarge: 'Image trop volumineuse (2 Mo maximum).',
      updated: 'Photo mise à jour.',
      removed: 'Photo supprimée.',
    },
    profile: {
      title: 'Profil',
      description: "L'adresse email ne peut pas être modifiée ici.",
      name: 'Nom complet',
      phone: 'Téléphone (optionnel)',
      phoneHint: 'Videz le champ pour supprimer votre numéro.',
      showPhone: 'Afficher mon numéro sur mes annonces longue durée',
      showPhoneOn:
        "Visible uniquement par les visiteurs connectés dont l'email est vérifié. Jamais sur les annonces courte durée.",
      showPhoneOff: 'Ajoutez un numéro pour activer cette option.',
      email: 'Email',
      updated: 'Profil mis à jour.',
    },
    password: {
      title: 'Mot de passe',
      description: "Le mot de passe actuel est demandé pour confirmer que c'est bien vous.",
      current: 'Mot de passe actuel',
      new: 'Nouveau mot de passe',
      newHint: '8 caractères minimum',
      confirm: 'Confirmer le nouveau mot de passe',
      mismatch: 'Les deux mots de passe ne correspondent pas.',
      submit: 'Changer le mot de passe',
      updated: 'Mot de passe mis à jour.',
    },
    danger: {
      title: 'Supprimer mon compte',
      description:
        'Cette action est irréversible. Vos annonces publiées seront automatiquement archivées. Impossible si vous avez une réservation à venir, comme voyageur ou comme propriétaire.',
      confirmLabel: 'Tapez {{word}} pour confirmer',
      // The word the user must type. Compared case-insensitively.
      word: 'SUPPRIMER',
      deleting: 'Suppression...',
      confirm: 'Oui, supprimer définitivement mon compte',
    },
  },

  propertyDetails: {
    notFoundTitle: 'Propriété introuvable',
    notFoundText: "Cette propriété n'existe pas, ou n'est plus disponible.",
    seeOthers: 'Voir les autres propriétés',
    backToProperties: 'Retour aux propriétés',
    backToSales: 'Retour aux biens à vendre',
    reviewsCount: '{{n}} avis',
    photoN: 'Photo {{n}}',
    bedrooms: 'Chambres : {{n}}',
    bathrooms: 'Salles de bain : {{n}}',
    builtIn: 'Construit en {{year}}',
    maxGuests: 'Voyageurs maximum : {{n}}',
    description: 'Description',
    amenities: 'Équipements',
    location: 'Localisation',
    owner: 'Propriétaire',
    deletedAccount: 'Compte supprimé',
    sellsThis: 'Vend ce bien',
    offersThis: 'Propose ce logement',
    negotiable: 'Prix négociable',
    condition: {
      new: 'Neuf',
      good: 'Bon état',
      to_renovate: 'À rénover',
    },
    legalStatus: {
      titled: 'Titre foncier',
      registering: "En cours d'immatriculation",
      melkia: 'Melkia',
      other: 'Autre statut juridique',
    },
    phone: {
      // <login> is the link; Trans keeps the word order free per language.
      logIn: '<login>Connectez-vous</login> pour voir le numéro du propriétaire.',
      verifyEmail: 'Vérifiez votre email pour voir le numéro du propriétaire.',
      reveal: 'Voir le numéro',
      revealWithFee: 'Voir le numéro — {{fee}}',
    },
  },

  booking: {
    signInTitle: 'Connectez-vous pour réserver',
    signInText: 'Il faut un compte pour envoyer une demande de réservation au propriétaire.',
    verifyTitle: 'Vérifiez votre email',
    verifyText: "La réservation est réservée aux comptes dont l'adresse email est vérifiée.",
    sentTitle: 'Demande envoyée',
    sentText: 'Total : <strong>{{total}}</strong>. Le propriétaire a 48h pour confirmer.',
    viewMine: 'Voir mes réservations',
    title: 'Réserver ce logement',
    guests: 'Nombre de voyageurs',
    guestsMax: '{{n}} maximum',
    nights: '{{price}} × {{n}} nuit(s)',
    months: '{{price}} × {{n}} mois',
    totalToPay: 'Total à payer',
    commission:
      'Dont commission Krihouse ({{rate}}%) : {{amount}}. Elle est incluse dans le total, vous ne payez rien en plus.',
    noCommission: 'Location longue durée : Krihouse ne prélève aucune commission sur le loyer.',
    submit: 'Demander à réserver',
    sending: 'Envoi...',
    footnote: 'Le montant est confirmé par le serveur au moment de la demande.',
  },

  calendar: {
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    loading: 'Chargement du calendrier...',
    loadError: 'Impossible de charger les disponibilités.',
    hint: "Cliquez une date d'arrivée, puis une date de départ. Les dates grisées sont déjà réservées.",
  },

  contactOwner: {
    titleOwner: 'Contacter le propriétaire',
    titleSeller: 'Contacter le vendeur',
    intro: 'Posez vos questions directement à {{name}}.',
    signInTitle: 'Connectez-vous pour écrire',
    signInText: 'Il faut un compte pour envoyer un message au propriétaire.',
    verifyTitle: 'Vérifiez votre email',
    verifyText: "L'envoi de messages est réservé aux comptes dont l'adresse email est vérifiée.",
    messageLabel: 'Votre message',
    placeholderRent: 'Bonjour, ce logement est-il toujours disponible ?',
    placeholderSale: 'Bonjour, ce bien est-il toujours à vendre ? Le prix est-il négociable ?',
    send: 'Envoyer le message',
    sending: 'Envoi...',
    unlimitedUntil: "Messages illimités jusqu'au {{date}}",
    freeLeft: 'Contacts gratuits restants : {{n}}',
    paywallTitle: 'Contacts gratuits épuisés',
    paywallText: 'Achetez un pass pour continuer à contacter des propriétaires sans limite.',
    pack7: '7 jours',
    pack15: '15 jours',
  },

  reviews: {
    title: 'Avis',
    loadError: 'Impossible de charger les avis.',
    empty: 'Aucun avis pour le moment. Les avis apparaissent après un séjour terminé.',
    ownerReply: 'Réponse du propriétaire',
    ratingLabel: 'Note : {{n}} sur 5',
    rate: 'Donner la note {{n}} sur 5',
  },

  map: {
    satelliteView: 'Vue satellite',
    mapView: 'Vue carte',
    locateMe: 'Me localiser',
    locationDenied: 'Localisation refusée',
    locating: 'Localisation...',
    routing: "Calcul de l'itinéraire...",
    route: 'Itinéraire depuis ma position',
    openGoogleMaps: 'Ouvrir dans Google Maps',
    routeSummary: '{{km}} km · environ {{minutes}} min en voiture',
    deniedHelp: "Localisation refusée — autorisez l'accès à votre position pour afficher l'itinéraire.",
    unavailable: "La localisation n'est pas disponible sur cet appareil.",
  },
}

export type TranslationSchema = typeof fr
