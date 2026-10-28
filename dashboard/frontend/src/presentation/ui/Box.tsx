import type { ReactNode } from 'react'
import { cn } from './cn'

/** A bordered panel with an optional small title. `padded` adds inner spacing for free-form content. */
export function Box({ title, padded, className, children }: { title?: string; padded?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn('min-w-0 rounded-lg border border-line bg-panel', padded && 'p-3.5', className)}>
      {title && <h3 className="m-0 border-b border-line px-3.5 py-2.5 font-mono text-[11px] font-medium tracking-[0.08em] text-muted uppercase">{title}</h3>}
      {children}
    </div>
  )
}

export const Pad = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn('p-3.5', className)}>{children}</div>
