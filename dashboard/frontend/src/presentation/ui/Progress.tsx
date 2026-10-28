import { cn } from './cn'

/** A thin progress bar, 0 to 100. */
export function Progress({ value, tone = 'docked', className, label }: { value: number; tone?: 'docked' | 'pass'; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}
      className={cn('h-1.5 overflow-hidden rounded-full bg-line', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-500', tone === 'pass' ? 'bg-pass' : 'bg-docked')} style={{ width: `${pct}%` }} />
    </div>
  )
}
