import type { Entry } from '../../../domain/benchmark'
import { classify } from '../../../domain/rmsd'
import { f2 } from '../../format'
import { Box } from '../../ui/Box'
import { tone } from '../../ui/tone'
import styles from './ComplexList.module.css'

const Num = ({ v }: { v: number | null }) =>
  v === null ? <span className={styles.num}>–</span> : <span className={`${styles.num} ${tone(classify(v))}`}>{f2(v)}</span>

interface GroupProps { title: string; items: Entry[]; current: string | null; onPick: (pdb: string) => void }

function Group({ title, items, current, onPick }: GroupProps) {
  if (!items.length) return null
  return (
    <>
      <div className={styles.groupHead}><span>{title}</span><span>DiffDock</span><span>Vina</span></div>
      {items.map(e => {
        const disabled = e.skipped || e.pending
        return (
          <button key={e.pdb} type="button" className={styles.row} aria-pressed={e.pdb === current} disabled={disabled}
            title={e.name} onClick={() => onPick(e.pdb)}>
            <span><b className={styles.pdb}>{e.pdb}</b><small className={styles.ligand}>{e.skipped ? 'descartado' : e.pending ? 'aguardando' : e.lig}</small></span>
            {disabled ? <span className={styles.spacer} /> : <><Num v={e.dd} /><Num v={e.vina} /></>}
          </button>
        )
      })}
    </>
  )
}

interface Props { entries: Entry[]; current: string | null; onPick: (pdb: string) => void }

export function ComplexList({ entries, current, onPick }: Props) {
  return (
    <Box title="Complexos" className={styles.list}>
      <Group title="Treino" items={entries.filter(e => e.group === 'train')} current={current} onPick={onPick} />
      <Group title="Cegos (pós-2021)" items={entries.filter(e => e.group === 'blind')} current={current} onPick={onPick} />
    </Box>
  )
}
