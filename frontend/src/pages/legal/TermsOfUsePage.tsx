import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { AlertTriangle, ArrowLeft, FileText } from 'lucide-react'

/**
 * /terms — Conditions d'Utilisation.
 *
 * TEXT IS HARDCODED FRENCH ON PURPOSE, not routed through i18n like the
 * rest of the app (see TranslationSchema in @/i18n/fr.ts) — same
 * treatment as the property details/account/owner/admin pages, which are
 * also still hardcoded French. Translating a legal document into English
 * and Darija is real, careful work, and this wording is a first draft
 * (see the notice below) that will change once a lawyer reviews it —
 * translating it now would mean redoing that work later for nothing.
 *
 * ⚠️ Ayoub: this is a generic starting point, NOT legal advice and NOT
 * reviewed by a lawyer. Have it checked before Krihouse takes real money
 * or handles disputes for real. Whenever the wording changes in a way
 * that matters, bump `VERSION` below AND config('legal.terms_version') on
 * the backend together — they must always say the same thing, since that
 * string is what decides whether an existing account needs to re-accept
 * (see AcceptTermsModal).
 */
const VERSION = 'v1'
const LAST_UPDATED = '28 septembre 2026'

export default function TermsOfUsePage() {
  const { t } = useTranslation()

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Helmet>
        <title>Conditions d'Utilisation — Krihouse</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t('common.backToHome')}
      </Link>

      <div className="mt-5 flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FileText className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Conditions d'Utilisation</h1>
          <p className="text-sm text-gray-500">
            Version {VERSION} — dernière mise à jour le {LAST_UPDATED}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Ce document est un modèle de démarrage, rédigé pour couvrir les cas les plus courants. Il n'a pas
          encore été relu par un avocat et pourra être précisé avant que Krihouse ne traite de vraies
          réservations payantes.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-lg font-bold text-gray-900">1. Objet</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Krihouse est une plateforme qui met en relation des propriétaires souhaitant louer un logement
            (appartement, villa, studio, riad, bureau) et des voyageurs à la recherche d'une location de
            courte ou longue durée au Maroc. Krihouse n'est ni propriétaire, ni locataire, ni agence
            immobilière : la plateforme met en relation les deux parties et facilite l'échange, la
            réservation et la communication entre elles.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">2. Compte utilisateur</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            La création d'un compte nécessite un nom, un email valide et un mot de passe. Vous vous engagez
            à fournir des informations exactes et à les maintenir à jour, et à garder vos identifiants
            confidentiels : vous êtes responsable de toute activité effectuée depuis votre compte. Un compte
            est personnel — le rôle de propriétaire n'est pas une inscription séparée, il est acquis
            automatiquement dès qu'un compte publie au moins une annonce.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">3. Rôle de Krihouse</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Krihouse fournit l'outil technique de mise en relation (annonces, recherche, messagerie,
            réservation, avis) mais n'est pas partie au contrat de location qui se forme entre le
            propriétaire et le voyageur. Krihouse est actuellement gratuit : la publication d'annonces et
            les réservations ne donnent lieu à aucun frais ni aucune commission de la part de Krihouse. Ce
            modèle pourra évoluer à l'avenir ; toute évolution sera annoncée sur la plateforme.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">4. Obligations des propriétaires</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Le propriétaire garantit qu'il a le droit de louer le logement publié, que les informations et
            photos de l'annonce sont exactes et à jour, et que le logement respecte les normes de sécurité
            et d'habitabilité en vigueur. Le propriétaire reste seul responsable du respect de ses
            obligations fiscales et réglementaires liées à la location.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">5. Obligations des voyageurs</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Le voyageur s'engage à utiliser le logement conformément à sa destination, à respecter les
            règles fixées par le propriétaire (nombre d'occupants, durée du séjour) et à signaler tout
            problème rencontré. Toute réservation effectuée via Krihouse engage le voyageur envers le
            propriétaire dans les conditions convenues entre eux.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">6. Avis et contenu publié</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Chaque utilisateur reste responsable du contenu qu'il publie (annonces, messages, avis, photos).
            Il est interdit de publier un contenu faux, trompeur, illégal ou portant atteinte à un tiers.
            Krihouse peut retirer un contenu ou suspendre un compte qui ne respecte pas ces règles, sans
            préavis en cas d'abus manifeste.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">7. Limitation de responsabilité</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Krihouse ne garantit pas l'exactitude des annonces publiées par les propriétaires ni la bonne
            exécution du séjour. Krihouse ne peut être tenu responsable des litiges, dommages ou pertes
            survenant entre un propriétaire et un voyageur, ni de l'état réel d'un logement. Chaque
            utilisateur est invité à faire preuve de vigilance et à communiquer clairement avant de
            confirmer une réservation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">8. Suspension et résiliation</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Krihouse peut suspendre ou clôturer un compte en cas de non-respect des présentes conditions, de
            fraude suspectée ou de comportement abusif envers d'autres utilisateurs. Vous pouvez à tout
            moment demander la suppression de votre compte depuis les paramètres de votre compte.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">9. Modification des présentes conditions</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Ces conditions peuvent être modifiées, notamment pour refléter l'évolution du service. Toute
            modification significative donnera lieu à une nouvelle demande d'acceptation la prochaine fois
            que vous utiliserez votre compte.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">10. Contact</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Pour toute question relative à ces conditions, vous pouvez nous écrire à{' '}
            <a href="mailto:fikriayoub65@gmail.com" className="font-semibold text-brand-600 hover:underline">
              fikriayoub65@gmail.com
            </a>
            .
          </p>
        </section>
      </div>

      <p className="mt-10 border-t border-gray-100 pt-6 text-sm text-gray-500">
        Voir aussi la{' '}
        <Link to="/privacy" className="font-semibold text-brand-600 hover:underline">
          Politique de Confidentialité
        </Link>
        .
      </p>
    </main>
  )
}
