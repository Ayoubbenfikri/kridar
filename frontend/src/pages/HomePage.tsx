import { useQuery } from '@tanstack/react-query'
import axiosClient from '@/api/axiosClient'

/**
 * Placeholder home page for Phase 14 - its only real job right now is to
 * prove the SPA can actually reach the Laravel API (CORS + the dev
 * servers on :5173/:8000 talking to each other). It gets replaced by the
 * real listing/search page in Phase 16.
 */
async function fetchPing() {
  const { data } = await axiosClient.get<{ status: string; app: string }>('/api/v1/ping')
  return data
}

export default function HomePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ping'],
    queryFn: fetchPing,
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold text-brand-700">Kridar</h1>
      <p className="text-brand-500">Phase 14 - connexion frontend / backend</p>

      {isLoading && <p className="text-gray-500">Connexion a l'API...</p>}

      {isError && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          Impossible de joindre l'API. Verifie que <code>php artisan serve</code> tourne bien
          sur le port 8000. ({(error as Error).message})
        </div>
      )}

      {data && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-700">
          API connectee - <code>{data.app}</code> repond : <strong>{data.status}</strong>
        </div>
      )}
    </main>
  )
}
