import type { ReactNode } from 'react'
import { cn } from './cn'

export type TagKind = 'ok' | 'run' | 'no' | 'bad'
const COLORS: Record<TagKind, string> = { ok: 'text-pass', run: 'text-warn', no: 'text-muted', bad: 'text-fail' }

export function Tag({ kind, children, className }: { kind: TagKind; children: ReactNode; className?: string }) {
  return <span className={cn('ml-auto rounded-[3px] border border-current px-1.5 py-0.5 font-mono text-[11px] font-medium whitespace-nowrap', COLORS[kind], className)}>{children}</span>
}
