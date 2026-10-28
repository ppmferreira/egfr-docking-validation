import styles from './Dot.module.css'

/** Amber dot that pulses while something is running. */
export const Pulse = () => <i className={styles.pulse} />
/** Grey dot for "nothing running". */
export const Idle = () => <i className={styles.idle} />
