import type { Verdict } from '../../domain/rmsd'
import styles from './tone.module.css'

/** Text colour class for a pose verdict (green hit, amber near, red miss). */
export const tone = (v: Verdict): string => styles[v]
