import { useRef } from 'react'
import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { MOTION_OK, gsap, useGSAP } from '@/lib/gsap'

type MotionTag = 'div' | 'section' | 'article' | 'header' | 'nav' | 'ul' | 'ol' | 'li' | 'p' | 'span'

interface MotionProps extends HTMLAttributes<HTMLElement> {
  /** The HTML tag to render. Default: div. */
  as?: MotionTag
  children: ReactNode
  /** Seconds to wait before starting. */
  delay?: number
  /** Seconds the animation lasts. */
  duration?: number
  /** Pixels the element travels up while fading in. 0 = fade only. */
  y?: number
  /**
   * true (default): play when the element scrolls into view.
   * false: play right away, on mount (use it for what is already on
   * screen when the page opens, and for content that is swapped in place).
   */
  scroll?: boolean
}

// "clamp()" keeps the trigger point reachable: without it, an element near
// the very bottom of a short page could never get high enough in the window
// to trigger, and would stay invisible forever.
const START = 'clamp(top 92%)'

// What GSAP must remove once an animation ends, so no inline style is left
// behind (a leftover transform would, for example, change how a sticky or
// fixed child positions itself).
const CLEAR = 'opacity,visibility,transform'

function trigger(element: Element, scroll: boolean) {
  return scroll ? { trigger: element, start: START, once: true } : undefined
}

/**
 * Fades one element in (and up a little). Wrap a section, a card, a heading.
 *
 *   <Reveal><h2>...</h2></Reveal>
 *   <Reveal as="section" delay={0.1} scroll={false}>...</Reveal>
 */
export function Reveal({
  as = 'div',
  delay = 0,
  duration = 0.6,
  y = 16,
  scroll = true,
  children,
  ...rest
}: MotionProps) {
  const ref = useRef<HTMLElement>(null)
  const Tag = as as ElementType

  useGSAP(
    () => {
      const element = ref.current
      if (!element) return undefined

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from(element, {
          autoAlpha: 0,
          y,
          duration,
          delay,
          clearProps: CLEAR,
          scrollTrigger: trigger(element, scroll),
        })
      })

      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  )
}

interface RevealGroupProps extends MotionProps {
  /** Seconds between two children starting. */
  stagger?: number
  /**
   * A value that changes when the CHILDREN change (e.g. the ids of the
   * listings on screen). The group then plays again for the new children.
   * Leave it out for a group that only needs to play once.
   */
  watch?: string | number
}

/**
 * Same as Reveal, but animates every DIRECT child one after the other.
 * Put it on the grid/list element itself:
 *
 *   <RevealGroup className="grid gap-6" watch={ids}>
 *     {items.map(...)}
 *   </RevealGroup>
 */
export function RevealGroup({
  as = 'div',
  delay = 0,
  duration = 0.5,
  y = 14,
  stagger = 0.06,
  scroll = true,
  watch,
  children,
  ...rest
}: RevealGroupProps) {
  const ref = useRef<HTMLElement>(null)
  const Tag = as as ElementType

  useGSAP(
    () => {
      const element = ref.current
      if (!element) return undefined

      const items = Array.from(element.children)
      if (items.length === 0) return undefined

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from(items, {
          autoAlpha: 0,
          y,
          duration,
          delay,
          // A long list must not take seconds to finish appearing.
          stagger: Math.min(stagger, 0.6 / items.length),
          clearProps: CLEAR,
          scrollTrigger: trigger(element, scroll),
        })
      })

      return () => mm.revert()
    },
    // revertOnUpdate: when `watch` changes, undo the old tween first so the
    // new children start from a clean state.
    { scope: ref, dependencies: [watch], revertOnUpdate: true },
  )

  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * Opens a panel that has just been mounted (filters). Height + opacity,
 * once, on mount. There is no closing animation: the panel is removed from
 * the page as soon as React unmounts it.
 *
 * Put the spacing INSIDE it (a pt-4 on the child, not a mt-4 on this
 * wrapper), otherwise the margin would jump in before the height grows.
 *
 *   {open && <Expand><div className="pt-4">...</div></Expand>}
 */
interface ExpandProps {
  children: ReactNode
  duration?: number
  className?: string
}

export function Expand({ children, duration = 0.35, className }: ExpandProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const element = ref.current
      if (!element) return undefined

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from(element, {
          height: 0,
          autoAlpha: 0,
          duration,
          overflow: 'hidden',
          clearProps: 'height,opacity,visibility,overflow',
        })
      })

      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
