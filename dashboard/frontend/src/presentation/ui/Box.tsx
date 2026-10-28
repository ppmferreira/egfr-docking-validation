import type { ReactNode } from 'react'
import styles from './Box.module.css'

/** A bordered panel with an optional small title. `padded` adds inner spacing for free-form content. */
export function Box({ title, padded, className, children }: { title?: string; padded?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={[styles.box, padded && styles.pad, className].filter(Boolean).join(' ')}>
      {title && <h3 className={styles.title}>{title}</h3>}
      {children}
    </div>
  )
}

export function Pad({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[styles.pad, className].filter(Boolean).join(' ')}>{children}</div>
}
