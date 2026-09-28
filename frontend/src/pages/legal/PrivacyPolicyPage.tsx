import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react'

/**
 * /privacy — Politique de Confidentialité.
 *
 * Same treatment as TermsOfUsePage: hardcoded French, not i18n'd (see the
 * comment at the top of that file for why), first draft not yet reviewed
 * by a lawyer, VERSION here must move together with config('legal.
 * terms_version') on the backend whenever the wording changes in a way
 * that matters.
 *
 * Written with Morocco's loi 09-08 (protection des données à caractère
 * personnel, CNDP) in mind — the right-to-access/rectify/delete section
 * below is what that law requires — but again: not a substitute for a
 * real legal review, especially once Krihouse handles real payments.
 */
const VERSION = 'v1'
const LAST_UPDATED = '28 septembre 2026'

export default function PrivacyPolicyPage() {
  const { t } = useTranslation()

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t('common.backToHome')}
      </Link>

      <div className="mt-5 flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Politique de Confidentialité</h1>
          <p className="text-sm text-gray-500">
            Version {VERSION} — dernière mise à jour le {LAST_UPDATED}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Ce document est un modèle de démarrage et n'a pas encore été relu par un avocat. Il pourra être
          précisé avant que Krihouse ne traite de vraies réservations payantes.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-lg font-bold text-gray-900">1. Responsable du traitement</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Krihouse est édité par Ayoub Benfikri, basé à Marrakech, Maroc. Pour toute question relative à
            vos données personnelles, vous pouvez écrire à{' '}
            <a href="mailto:fikriayoub65@gmail.com" className="font-semibold text-brand-600 hover:underline">
              fikriayoub65@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">2. Données collectées</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">Krihouse collecte :</p>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-sm leading-relaxed text-gray-600">
            <li>les données de compte : nom, email, mot de passe (jamais stocké en clair), téléphone ;</li>
            <li>
              les données liées à l'usage du service : annonces publiées, réservations, messages échangés
              avec un autre utilisateur, avis laissés ;
            </li>
            <li>des données techniques minimales (langue de l'interface, journaux serveur).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">3. Pourquoi ces données sont collectées</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Ces données servent à créer et sécuriser votre compte, permettre la publication d'annonces et la
            mise en relation entre propriétaires et voyageurs, faire fonctionner la messagerie et les
            réservations, et à répondre à nos obligations légales. Elles ne sont jamais utilisées à des fins
            publicitaires tierces.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">4. Partage des données</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Vos données ne sont jamais vendues. Elles sont partagées uniquement : entre vous et l'autre
            partie d'une réservation ou d'une conversation (dans la mesure nécessaire à celle-ci), et avec
            les prestataires techniques indispensables au fonctionnement du site (hébergement, envoi
            d'emails), qui n'ont pas le droit de les utiliser à d'autres fins.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">5. Durée de conservation</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte,
            elles sont supprimées ou anonymisées, sauf lorsqu'une obligation légale impose une durée de
            conservation plus longue (par exemple des documents liés à une transaction).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">6. Sécurité</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Les mots de passe sont stockés sous forme hachée (jamais en clair) et les échanges avec le site
            sont chiffrés. Aucun système n'est infaillible, mais des mesures raisonnables sont mises en
            œuvre pour protéger vos données contre un accès non autorisé.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">7. Vos droits</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Conformément à la loi 09-08 relative à la protection des personnes physiques à l'égard du
            traitement des données à caractère personnel, vous disposez d'un droit d'accès, de
            rectification, de suppression et d'opposition sur vos données. La plupart de ces actions sont
            disponibles directement depuis les paramètres de votre compte ; pour toute autre demande,
            écrivez à{' '}
            <a href="mailto:fikriayoub65@gmail.com" className="font-semibold text-brand-600 hover:underline">
              fikriayoub65@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">8. Cookies</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Krihouse utilise uniquement un cookie de session nécessaire à votre connexion (authentification).
            Aucun cookie publicitaire ou de suivi tiers n'est utilisé à ce jour.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">9. Modification de cette politique</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Cette politique peut évoluer, notamment pour refléter un nouveau traitement de données. Toute
            modification significative donnera lieu à une nouvelle demande d'acceptation.
          </p>
        </section>
      </div>

      <p className="mt-10 border-t border-gray-100 pt-6 text-sm text-gray-500">
        Voir aussi les{' '}
        <Link to="/terms" className="font-semibold text-brand-600 hover:underline">
          Conditions d'Utilisation
        </Link>
        .
      </p>
    </main>
  )
}
