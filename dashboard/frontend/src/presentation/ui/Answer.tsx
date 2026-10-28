import type { ReactNode } from 'react'
import styles from './Answer.module.css'

export type AnswerKind = 'ok' | 'warn' | 'fail' | 'no'

/** The one-line verdict every page opens with. */
export function Answer({ kind, chip, children }: { kind: AnswerKind; chip: string; children: ReactNode }) {
  return (
    <div className={`${styles.answer} ${styles[kind]}`}>
      <span className={styles.chip}>{chip}</span>
      <p className={styles.text}>{children}</p>
    </div>
  )
}
