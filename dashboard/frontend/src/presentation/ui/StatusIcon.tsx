import { CheckCircle2, Circle, Loader2, Lock } from 'lucide-react'
import type { ItemStatus } from '../../domain/roadmap'
import { cn } from './cn'

/** One icon per state: done, running (spinning), pending, blocked by an earlier item. */
export function StatusIcon({ status, className }: { status: ItemStatus; className?: string }) {
  const base = cn('size-[18px] shrink-0', className)
  switch (status) {
    case 'done': return <CheckCircle2 className={cn(base, 'text-pass')} aria-label="concluído" />
    case 'running': return <Loader2 className={cn(base, 'animate-spin-slow text-warn motion-reduce:animate-none')} aria-label="em andamento" />
    case 'blocked': return <Lock className={cn(base, 'text-muted')} aria-label="aguardando" />
    default: return <Circle className={cn(base, 'text-muted')} aria-label="pendente" />
  }
}
