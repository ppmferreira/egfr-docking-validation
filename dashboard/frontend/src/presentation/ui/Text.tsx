import type { CSSProperties, ReactNode } from 'react'
import styles from './Text.module.css'

export const Note = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => <span className={styles.note} style={style}>{children}</span>
export const Lead = ({ children }: { children: ReactNode }) => <p className={styles.lead}>{children}</p>
