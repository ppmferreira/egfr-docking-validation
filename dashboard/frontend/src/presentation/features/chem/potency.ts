import type { PotencyId } from '../../../domain/compounds'

/** One teal ramp, darkest = most potent, so the order is readable without a legend. */
export const POTENCY_COLOR: Record<PotencyId, string> = {
  high: 'var(--docked)',
  good: 'color-mix(in srgb, var(--docked) 65%, var(--panel))',
  mid: 'color-mix(in srgb, var(--docked) 38%, var(--panel))',
  low: 'color-mix(in srgb, var(--muted) 55%, var(--panel))',
}
