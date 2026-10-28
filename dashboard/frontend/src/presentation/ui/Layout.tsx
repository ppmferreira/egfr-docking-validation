import type { ReactNode } from 'react'
import { cn } from './cn'

/** Vertical rhythm of a whole screen. */
export const Page = ({ children, className }: { children: ReactNode; className?: string }) => <section className={cn('grid gap-4', className)}>{children}</section>
/** Responsive columns, at least 300 px each. */
export const Grid = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-4', className)}>{children}</div>
)
export const Stack = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn('grid gap-4', className)}>{children}</div>
