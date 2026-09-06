import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { Badge, Button, Card, Container, EmptyState, Input, Skeleton } from '@/components/ui'

/**
 * /ui - living style guide. Not linked from the navbar: it exists so the
 * design system can be reviewed in one place, and so a new component can
 * be checked here before it is used across the real pages.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-gray-200 pt-6">
      <h2 className="mb-5 text-xs font-semibold tracking-[0.09em] text-gray-400 uppercase">{title}</h2>
      {children}
    </section>
  )
}

export default function UiKitPage() {
  return (
    <Container size="lg" className="space-y-12 py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Design system Kridar</h1>
        <p className="mt-1.5 text-gray-500">
          Les composants de base. Toutes les pages seront reconstruites avec ceux-ci.
        </p>
      </header>

      <Section title="Couleurs">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ['bg-brand-600', 'brand-600', 'Principal'],
            ['bg-brand-500', 'brand-500', 'Principal clair'],
            ['bg-accent', 'accent', 'Accent'],
            ['bg-gray-900', 'gray-900', 'Texte'],
            ['bg-gray-500', 'gray-500', 'Texte secondaire'],
          ].map(([bg, token, label]) => (
            <div key={token}>
              <div className={`h-16 rounded-xl border border-gray-200 ${bg}`} />
              <p className="mt-2 text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{token}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typographie">
        <div className="space-y-2">
          <p className="text-3xl font-bold tracking-tight">Titre de page — 30px bold</p>
          <p className="text-xl font-semibold">Titre de section — 20px semibold</p>
          <p className="text-[15px]">Texte courant — 15px, la taille par defaut du site.</p>
          <p className="text-sm text-gray-500">Texte secondaire — 14px gris.</p>
        </div>
      </Section>

      <Section title="Boutons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Reserver</Button>
          <Button icon={<Plus className="size-4" />}>Ajouter une propriete</Button>
          <Button variant="secondary">Annuler</Button>
          <Button variant="secondary" icon={<Pencil className="size-4" />}>
            Modifier
          </Button>
          <Button variant="ghost">Ignorer</Button>
          <Button variant="danger" icon={<Trash2 className="size-4" />}>
            Supprimer
          </Button>
          <Button isLoading>Enregistrement</Button>
          <Button disabled>Desactive</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm">Petit</Button>
          <Button size="sm" variant="secondary">
            Petit secondaire
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge tone="green" icon={<CheckCircle2 className="size-3.5" />}>
            Publiee
          </Badge>
          <Badge tone="amber">En attente</Badge>
          <Badge tone="slate">Brouillon</Badge>
          <Badge tone="red">Annulee</Badge>
          <Badge tone="teal">Confirmee</Badge>
        </div>
      </Section>

      <Section title="Champs de formulaire">
        <Card className="grid gap-5 p-6 sm:grid-cols-2">
          <Input label="Ville" defaultValue="Marrakech" icon={<MapPin className="size-5" />} />
          <Input
            label="Voyageurs"
            placeholder="Nombre de personnes"
            icon={<Users className="size-5" />}
            hint="Survole le champ, puis clique dedans."
          />
          <Input label="Prix par nuit (MAD)" defaultValue="-50" error="Le prix doit etre superieur a 0." />
          <Input label="Statut (non modifiable)" defaultValue="Suspendue par un admin" disabled />
        </Card>
      </Section>

      <Section title="Cartes">
        <div className="grid gap-5 sm:grid-cols-3">
          <Card interactive className="p-5">
            <p className="font-semibold text-gray-900">Carte interactive</p>
            <p className="mt-1 text-sm text-gray-500">Survole-la : elle monte de 4px.</p>
          </Card>
          <Card className="p-5">
            <p className="font-semibold text-gray-900">Carte statique</p>
            <p className="mt-1 text-sm text-gray-500">Pas de survol : rien a cliquer.</p>
          </Card>
          <Card className="p-5">
            <p className="mb-3 font-semibold text-gray-900">Chargement</p>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <Skeleton className="mt-4 h-9 w-28" />
          </Card>
        </div>
      </Section>

      <Section title="Etat vide">
        <EmptyState
          icon={<Inbox className="size-6" />}
          title="Aucune reservation pour le moment"
          description="Quand un voyageur reservera l'un de tes logements, la demande apparaitra ici."
          action={<Button icon={<Search className="size-4" />}>Parcourir les proprietes</Button>}
        />
      </Section>

      <Section title="Messages">
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <CheckCircle2 className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Reservation confirmee</p>
              <p className="text-sm text-gray-500">Le voyageur a ete notifie par email.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertCircle className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Impossible d'enregistrer</p>
              <p className="text-sm text-gray-500">Verifie le prix par nuit et reessaie.</p>
            </div>
          </div>
        </div>
      </Section>
    </Container>
  )
}
