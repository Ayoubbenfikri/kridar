import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastTone = 'success' | 'error' | 'info'

interface Toast {
  id: number
  tone: ToastTone
  message: string
}

interface ToastContextValue {
  /** Shows a toast. Use it for an action whose result is not visible
      where the user is standing - publishing a property, confirming a
      request. Form errors stay inline, next to the field. */
  showToast: (tone: ToastTone, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE_STYLES: Record<ToastTone, { icon: ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle2 className="size-4" aria-hidden />,
    className: 'bg-green-50 text-green-700',
  },
  error: {
    icon: <AlertCircle className="size-4" aria-hidden />,
    className: 'bg-red-50 text-red-600',
  },
  info: {
    icon: <Info className="size-4" aria-hidden />,
    className: 'bg-brand-50 text-brand-600',
  },
}

const AUTO_DISMISS_MS = 4500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  // Every pending dismiss timer, so they can all be cleared on unmount
  // instead of firing setState on a gone component.
  const timers = useRef<number[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, tone, message }])
      timers.current.push(window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS))
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* aria-live so a screen reader announces the message without the
          focus ever being moved away from what the user was doing. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-lg"
          >
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg',
                TONE_STYLES[toast.tone].className,
              )}
            >
              {TONE_STYLES[toast.tone].icon}
            </span>
            <p className="flex-1 pt-1 text-sm text-gray-800">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Fermer"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast doit etre utilise a l interieur de <ToastProvider>')
  }
  return context
}
