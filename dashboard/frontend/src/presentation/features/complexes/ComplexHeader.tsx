import type { Entry } from '../../../domain/benchmark'
import { classify, isHit } from '../../../domain/rmsd'
import { f2 } from '../../format'
import { tone } from '../../ui/tone'
import styles from './ComplexHeader.module.css'

function Tile({ label, value, caption }: { label: string; value: number | null; caption: string }) {
  return (
    <div className={styles.tile}>
      <small>{label}</small>
      <strong className={value === null ? '' : tone(classify(value))}>{value === null ? '–' : `${f2(value)} Å`}</strong>
      <span>{caption}</span>
    </div>
  )
}

export function ComplexHeader({ entry }: { entry: Entry }) {
  const origin = entry.group === 'train'
    ? 'Estrutura antiga, provavelmente nos dados de treino do DiffDock.'
    : `Publicada depois do treino do DiffDock${entry.res ? ` · ${entry.res} Å de resolução` : ''}.`
  return (
    <div className={styles.head}>
      <div>
        <h2 className={styles.title}>{entry.pdb}<span>{entry.lig}</span></h2>
        <div className={styles.sub}>{origin}</div>
      </div>
      <div className={styles.tiles}>
        <Tile label="DiffDock · pose 1" value={entry.dd} caption={entry.dd === null ? 'sem resultado' : isHit(entry.dd) ? 'acertou' : 'errou'} />
        <Tile label={`Vina · média de ${entry.vn ?? 3} seeds`} value={entry.vina} caption={entry.vn ? `${entry.vpass} de ${entry.vn} seeds ≤ 2 Å` : 'sem resultado'} />
      </div>
    </div>
  )
}
