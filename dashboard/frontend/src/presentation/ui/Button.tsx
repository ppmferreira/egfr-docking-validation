import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { cn } from './cn'

const BASE = 'inline-flex cursor-pointer items-center gap-1.5 rounded-md text-[13px] font-medium no-underline transition-colors disabled:cursor-default disabled:opacity-50'

/** A button, or a link styled as one when `href` is given. */
export function Button({ href, onNavigate, variant = 'ghost', className, children, ...rest }: {
  href?: string; onNavigate?: (e: MouseEvent) => void; variant?: 'ghost' | 'outline'; className?: string; children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const look = variant === 'outline'
    ? 'border border-line bg-paper px-3 py-1.5 text-ink hover:border-docked'
    : 'px-2 py-1 text-docked hover:bg-docked/10'
  if (href) return <a href={href} onClick={onNavigate} className={cn(BASE, look, className)}>{children}</a>
  return <button type="button" className={cn(BASE, look, className)} {...rest}>{children}</button>
}
