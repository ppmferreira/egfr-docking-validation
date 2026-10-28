import type { ReactNode } from 'react'
import { cn } from './cn'

export type AnswerKind = 'ok' | 'warn' | 'fail' | 'no'
const BORDER: Record<AnswerKind, string> = { ok: 'border-pass', warn: 'border-warn', fail: 'border-fail', no: 'border-line' }
const CHIP: Record<AnswerKind, string> = { ok: 'text-pass', warn: 'text-warn', fail: 'text-fail', no: 'text-muted' }

/** The one-line verdict a page opens with. */
export function Answer({ kind, chip, children }: { kind: AnswerKind; chip: string; children: ReactNode }) {
  return (
    <div className={cn('flex items-start gap-3.5 rounded-lg border bg-panel px-4 py-3.5', BORDER[kind])}>
      <span className={cn('mt-0.5 rounded-[3px] border border-current px-2 py-1 font-mono text-[11px] font-medium tracking-[0.06em] whitespace-nowrap uppercase', CHIP[kind])}>{chip}</span>
      <p className="m-0 max-w-[78ch] [&_b]:font-semibold">{children}</p>
    </div>
  )
}
