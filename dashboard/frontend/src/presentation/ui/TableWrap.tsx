import type { ReactNode } from 'react'
import styles from './TableWrap.module.css'

/** Lets a wide table scroll sideways instead of breaking the layout. */
export const TableWrap = ({ children, className }: { children: ReactNode; className?: string }) => <div className={[styles.wrap, className].filter(Boolean).join(' ')}>{children}</div>
