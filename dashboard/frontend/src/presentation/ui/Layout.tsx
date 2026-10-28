import type { ReactNode } from 'react'
import styles from './Layout.module.css'

/** Vertical rhythm of a whole screen. */
export const Page = ({ children }: { children: ReactNode }) => <section className={styles.page}>{children}</section>
/** Responsive columns, at least 300 px each. */
export const Grid = ({ children }: { children: ReactNode }) => <div className={styles.grid}>{children}</div>
export const Stack = ({ children }: { children: ReactNode }) => <div className={styles.stack}>{children}</div>
