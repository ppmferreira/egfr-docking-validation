import type { ReactNode } from 'react'
import { cn } from './cn'

/** Lets a wide table scroll sideways instead of breaking the layout. */
export const TableWrap = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn('overflow-x-auto', className)}>{children}</div>
