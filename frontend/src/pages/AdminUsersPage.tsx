import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, ShieldCheck, TriangleAlert, UserCheck, UserX, Users } from 'lucide-react'
import { useActivateUser, useAdminUsers, useSuspendUser } from '@/features/admin/useAdmin'
import { getErrorMessage } from '@/lib/apiErrors'
import { Badge, Button, Card, EmptyState, Pagination, Skeleton, useToast } from '@/components/ui'
import type { User } from '@/types/user'

/**
 * /admin/users - every account, newest first. GET /admin/users takes no
 * filter or search parameter and its page size is fixed at 15
 * server-side, so this page offers neither: a search box that only
 * filtered the 15 rows on screen would lie about what it does.
 */
export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { showToast } = useToast()
  const { data, isError, error, isFetching } = useAdminUsers(page)
  const suspendUser = useSuspendUser()
  const activateUser = useActivateUser()
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSuspend(user: User) {
    suspendUser.mutate(user.id, {
      onSuccess: () => {
        setConfirmingId(null)
        showToast('success', `${user.name} a été suspendu.`)
      },
    })
  }

  /**
   * No confirmation step, unlike suspending. Friction should match
   * consequence: this one restores access and can be undone by the very
   * button next to it, so a dialog would just be a speed bump.
   */
  function handleActivate(user: User) {
    activateUser.mutate(user.id, {
      onSuccess: () => showToast('success', `${user.name} peut se reconnecter.`),
    })
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Utilisateurs</h1>
      {data && (
        <p className="mt-1 text-sm text-gray-500">
          {data.meta.total} compte{data.meta.total > 1 ? 's' : ''}
        </p>
      )}

      {activateUser.isError && (
        <Card className="mt-4 flex items-start gap-3 border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {getErrorMessage(activateUser.error)}
        </Card>
      )}

      <div className="mt-6">
        {isError ? (
          <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            {getErrorMessage(error)}
          </Card>
        ) : !data ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <EmptyState icon={<Users className="size-6" />} title="Aucun compte" />
        ) : (
          <>
            <div className={`space-y-3 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
              {data.data.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                        {user.name
                          .split(' ')
                          .slice(0, 2)
                          .map((part) => part.charAt(0).toUpperCase())
                          .join('')}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{user.name}</p>
                        <p className="truncate text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {user.role === 'admin' && (
                        <Badge tone="teal" icon={<ShieldCheck className="size-3.5" />}>
                          Admin
                        </Badge>
                      )}
                      {!user.email_verified && <Badge tone="amber">Email non vérifié</Badge>}
                      <Badge tone={user.status === 'active' ? 'green' : 'red'}>
                        {user.status === 'active' ? 'Actif' : 'Suspendu'}
                      </Badge>

                      {/* Never for an admin account: AdminService refuses
                          to suspend one, so offering the button would only
                          produce a 409. */}
                      {user.role !== 'admin' &&
                        (user.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<UserX className="size-4" />}
                            onClick={() => setConfirmingId(user.id)}
                          >
                            Suspendre
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<UserCheck className="size-4" />}
                            isLoading={activateUser.isPending && activateUser.variables === user.id}
                            onClick={() => handleActivate(user)}
                          >
                            Réactiver
                          </Button>
                        ))}
                    </div>
                  </div>

                  {confirmingId === user.id && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-semibold text-red-800">Suspendre {user.name} ?</p>
                      <ul className="mt-2 space-y-1 text-sm text-red-700">
                        <li>• Le compte est déconnecté immédiatement et ne peut plus rien faire.</li>
                        <li>• Ses annonces publiées passent en suspendu.</li>
                        <li>
                          • Réversible avec « Réactiver », mais les annonces ne se republient pas
                          toutes seules : il faut les approuver une par une.
                        </li>
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={suspendUser.isPending}
                          onClick={() => handleSuspend(user)}
                        >
                          Oui, suspendre
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setConfirmingId(null)}>
                          Annuler
                        </Button>
                      </div>
                      {suspendUser.isError && (
                        <p className="mt-3 flex items-start gap-2 text-sm text-red-700">
                          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                          {getErrorMessage(suspendUser.error)}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <Pagination currentPage={page} lastPage={data.meta.last_page} onChange={goToPage} />
          </>
        )}
      </div>
    </>
  )
}
