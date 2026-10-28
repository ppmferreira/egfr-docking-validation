import type { ComplexDetail } from '../../../domain/entities'
import { classify } from '../../../domain/rmsd'
import { describeFit, f2 } from '../../format'
import { Box } from '../../ui/Box'
import { Note } from '../../ui/Text'
import styles from './PoseChips.module.css'

function Chip({ n, rmsd, selected, onClick }: { n: number; rmsd: number; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`${styles.chip} ${styles[classify(rmsd)]}`} aria-pressed={selected} title={`RMSD ${f2(rmsd)} Å`} onClick={onClick}>
      <b>{n}</b><small>{f2(rmsd)}</small>
    </button>
  )
}

interface Props {
  detail: ComplexDetail
  ddRank: number
  vinaPose: number
  onDiffDock: (rank: number) => void
  onVina: (pose: number) => void
}

/** Pick which DiffDock / Vina pose is drawn; each chip is coloured by its RMSD to the crystal. */
export function PoseChips({ detail, ddRank, vinaPose, onDiffDock, onVina }: Props) {
  const d = detail.diffdock.find(p => p.rank === ddRank)
  const v = detail.vina.find(p => p.pose === vinaPose)
  return (
    <Box>
      <div className={styles.group}>
        <div className={styles.label}><b>DiffDock</b><small>posição por confiança</small></div>
        <div className={styles.chips}>
          {detail.diffdock.map(p => <Chip key={p.rank} n={p.rank} rmsd={p.rmsd} selected={p.rank === ddRank} onClick={() => onDiffDock(p.rank)} />)}
          {!detail.diffdock.length && <Note>sem poses ainda</Note>}
        </div>
      </div>
      <div className={styles.group}>
        <div className={styles.label}><b>Vina</b><small>seed 1, por score</small></div>
        <div className={styles.chips}>
          {detail.vina.map(p => <Chip key={p.pose} n={p.pose} rmsd={p.rmsd} selected={p.pose === vinaPose} onClick={() => onVina(p.pose)} />)}
          {!detail.vina.length && <Note>sem poses ainda</Note>}
        </div>
      </div>
      <div className={styles.info}>
        {d && (
          <span>
            <b>DiffDock, posição {d.rank}:</b> {f2(d.rmsd)} Å, {describeFit(d.rmsd)}
            {d.confidence !== null && <> · confiança {f2(d.confidence)}</>}.{' '}
            {d.rank === 1 ? 'É a pose que o DiffDock escolheria.' : 'O DiffDock escolheria a posição 1.'}
          </span>
        )}
        {v && (
          <span>
            <b>Vina, pose {v.pose}:</b> {f2(v.rmsd)} Å, {describeFit(v.rmsd)} · score {f2(v.score)} kcal/mol.{' '}
            {v.pose === 1 ? 'É a pose que o Vina escolheria.' : 'O Vina escolheria a pose 1.'}
          </span>
        )}
      </div>
    </Box>
  )
}
