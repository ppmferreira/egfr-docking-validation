import { animate, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

/** A whole number that counts up to its value once, unless the user asked for reduced motion. */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduce) { el.textContent = String(value); return }
    const controls = animate(0, value, { duration: 0.9, ease: 'easeOut', onUpdate: v => { el.textContent = String(Math.round(v)) } })
    return () => controls.stop()
  }, [value, reduce])
  return <span ref={ref}>{value}</span>
}
