import type { ReactNode } from 'react'

export type AnswerKind = 'ok' | 'warn' | 'fail' | 'no'

/** The one-line verdict every tab opens with. */
export function Answer({ kind, chip, children }: { kind: AnswerKind; chip: string; children: ReactNode }) {
  return (
    <div className={`answer ${kind}`}>
      <span className="chip">{chip}</span>
      <p>{children}</p>
    </div>
  )
}

export function Box({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`box ${className ?? ''}`}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  )
}
