import type { ReactNode } from 'react'
import styles from './Tag.module.css'

export type TagKind = 'ok' | 'run' | 'no' | 'bad'

export function Tag({ kind, children }: { kind: TagKind; children: ReactNode }) {
  return <span className={`${styles.tag} ${styles[kind]}`}>{children}</span>
}
