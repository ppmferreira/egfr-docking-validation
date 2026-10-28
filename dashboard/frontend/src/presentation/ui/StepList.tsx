import type { ReactNode } from 'react'
import styles from './StepList.module.css'

/** A bordered list of rows (project steps, running jobs, guide links). */
export const StepList = ({ children }: { children: ReactNode }) => <ul className={styles.steps}>{children}</ul>
export const stepLinkClass = styles.link
