import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { MOTION_OK, gsap, motionAllowed, useGSAP } from '@/lib/gsap'

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

/**
 * One toast. It owns its own life cycle: it slides in when it mounts, and
 * it slides out before asking the provider to remove it - both when the
 * user clicks the X and when the auto-dismiss timer runs out. (That is why
 * the timer lives here and no longer in the provider: only the toast knows
 * how to play its exit before disappearing.)
 */
function ToastItem({
  toast,
  closeLabel,
  onRemove,
}: {
  toast: Toast
  closeLabel: string
  onRemove: (id: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isClosing = useRef(false)

  useGSAP(
    () => {
      const element = ref.current
      if (!element) return undefined

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from(element, {
          autoAlpha: 0,
          y: 16,
          scale: 0.97,
          duration: 0.3,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform',
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  const close = useCallback(() => {
    if (isClosing.current) return
    isClosing.current = true

    const element = ref.current
    if (!element || !motionAllowed()) {
      onRemove(toast.id)
      return
    }
    gsap.to(element, {
      autoAlpha: 0,
      y: 8,
      duration: 0.2,
      ease: 'power1.in',
      onComplete: () => onRemove(toast.id),
    })
  }, [onRemove, toast.id])

  useEffect(() => {
    const timer = window.setTimeout(close, AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [close])

  return (
    <div
      ref={ref}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-lg"
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
        onClick={close}
        aria-label={closeLabel}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((tone: ToastTone, message: string) => {
    const id = nextId.current++
    setToasts((current) => [...current, { id, tone, message }])
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* aria-live so a screen reader announces the message without the
          focus ever being moved away from what the user was doing.

          sm:end-6 rather than sm:right-6 (Phase 27): toasts belong in the
          corner the eye rests in, which is the left one when the page
          reads right to left. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:end-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} closeLabel={t('common.close')} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    // Developer-facing, never shown to a user — deliberately not
    // translated.
    throw new Error('useToast doit etre utilise a l interieur de <ToastProvider>')
  }
  return context
}
