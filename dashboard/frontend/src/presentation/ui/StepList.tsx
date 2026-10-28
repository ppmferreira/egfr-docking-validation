import type { MouseEvent, ReactNode } from 'react'

/** A bordered list of rows (running jobs, steps). */
export const StepList = ({ children }: { children: ReactNode }) => (
  <ul className="m-0 list-none p-0 [&>li]:flex [&>li]:items-baseline [&>li]:gap-3 [&>li]:border-t [&>li]:border-line [&>li]:px-3.5 [&>li]:py-2 [&>li:first-child]:border-t-0">{children}</ul>
)

/** Right-aligned link at the end of a row. */
export const StepLink = ({ href, onClick, children }: { href: string; onClick: (e: MouseEvent) => void; children: ReactNode }) => (
  <a className="ml-auto whitespace-nowrap" href={href} onClick={onClick}>{children}</a>
)
