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
    myReservations: 'Mes réservations',
    ownerSpace: 'Espace propriétaire',
    admin: 'Administration',
    favorites: 'Mes favoris',
    account: 'Mon compte',
    settings: 'Paramètres',
    logout: 'Se déconnecter',
    loggingOut: 'Déconnexion...',
    login: 'Connexion',
    register: "S'inscrire",
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
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
  },

  propertyType: {
    all: 'Tous les types',
    apartment: 'Appartement',
    villa: 'Villa',
    studio: 'Studio',
    riad: 'Riad',
    office: 'Bureau',
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
  },

  search: {
    destination: 'Destination',
    destinationPlaceholder: 'Marrakech, Casablanca...',
    propertyType: 'Type de logement',
    guests: 'Voyageurs',
    guestsPlaceholder: '2',
    submit: 'Rechercher',
  },

  home: {
    badge: 'Location courte et longue durée au Maroc',
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
  },

  filters: {
    propertyType: 'Type de logement',
    rentalType: 'Durée de location',
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
  },
}

export type TranslationSchema = typeof fr
