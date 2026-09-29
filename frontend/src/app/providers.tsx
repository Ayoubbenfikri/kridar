import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { ToastProvider } from '@/components/ui'

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
  return (
    // Outermost: every page sets its <title>/<meta> via <Helmet> (SEO
    // work, see robots.txt + SitemapController on the backend), and this
    // is what lets react-helmet-async collect those tags and write them
    // into the real <head> regardless of where in the tree a page sits.
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </HelmetProvider>
  )
}
