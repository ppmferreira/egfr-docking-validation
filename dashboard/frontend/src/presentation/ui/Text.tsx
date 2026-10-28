import type { CSSProperties, ReactNode } from 'react'
import { cn } from './cn'

export const Note = ({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) => (
  <span className={cn('text-[13px] text-muted', className)} style={style}>{children}</span>
)
export const Lead = ({ children, className }: { children: ReactNode; className?: string }) => <p className={cn('m-0 max-w-[72ch] text-muted', className)}>{children}</p>
