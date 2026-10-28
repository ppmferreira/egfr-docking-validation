import type { Verdict } from '../../domain/rmsd'

/** Text colour for a pose verdict (green hit, amber near, red miss). */
export const tone = (v: Verdict): string => (v === 'ok' ? 'text-pass' : v === 'near' ? 'text-warn' : 'text-fail')

/** Border colour for the same verdicts. */
export const toneBorder = (v: Verdict): string => (v === 'ok' ? 'border-pass' : v === 'near' ? 'border-warn' : 'border-fail')

/** Background colour for the same verdicts. */
export const toneBg = (v: Verdict): string => (v === 'ok' ? 'bg-pass' : v === 'near' ? 'bg-warn' : 'bg-fail')
