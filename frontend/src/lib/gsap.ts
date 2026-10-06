import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

/**
 * The ONE place GSAP is set up. Every component imports gsap, ScrollTrigger
 * and useGSAP from here (never from 'gsap' directly), so the plugins are
 * registered exactly once and the defaults below apply everywhere.
 *
 * Animation rules for this project (Phase "GSAP"):
 *   - Subtle: a short fade + a few pixels of movement, 0.3-0.6 s.
 *   - Only transform + opacity are animated (cheap for the browser), except
 *     the filters panel which also animates its height.
 *   - Everything is wrapped in gsap.matchMedia(MOTION_OK), so a visitor who
 *     turned on "reduce motion" in their system sees the page with no
 *     animation at all, not a slower one.
 *   - Elements are NEVER hidden in CSS. GSAP hides them in a layout effect
 *     (before the first paint) and removes its inline styles when done
 *     (clearProps), so if the script fails the content is simply visible.
 */
gsap.registerPlugin(ScrollTrigger, useGSAP)
gsap.defaults({ ease: 'power2.out' })

/** The media query under which animations are allowed to run. */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'

/** Same check, for code that is not inside gsap.matchMedia (e.g. an exit tween). */
export function motionAllowed(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(MOTION_OK).matches
}

/**
 * ScrollTrigger measures where each element sits ONCE, when it is created.
 * Our pages change height after that (skeletons become cards, images load,
 * a language switch reflows the text), so those measurements go stale and
 * a reveal could fire too early or too late. This watches the page height
 * and asks ScrollTrigger to measure again, at most once per 200 ms.
 * Call it once, in AppLayout.
 */
export function useScrollTriggerAutoRefresh(): void {
  useEffect(() => {
    let timer: number | undefined
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 200)
    })
    observer.observe(document.body)

    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [])
}

export { gsap, ScrollTrigger, useGSAP }
