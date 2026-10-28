import type { ReactNode } from 'react'
import styles from './AppShell.module.css'

/** Sidebar on the left, the current page on the right. */
export const AppShell = ({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) => (
  <div className={styles.shell}>{sidebar}<main className={styles.main}>{children}</main></div>
)
