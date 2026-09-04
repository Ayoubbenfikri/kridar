import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A 401/403 from a protected endpoint won't fix itself by retrying
      // — retrying is only useful for real network hiccups.
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
