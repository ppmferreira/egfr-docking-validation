import type { ComplexDetail } from '../../api'
import { cls, f2, how } from '../../lib/format'

function Chip({ n, rmsd, selected, onClick }: { n: number; rmsd: number; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`pchip ${cls(rmsd)}`} aria-pressed={selected} title={`RMSD ${f2(rmsd)} Å`} onClick={onClick}>
      <b>{n}</b><small>{f2(rmsd)}</small>
    </button>
  )
}

interface Props {
  detail: ComplexDetail
  ddRank: number
  vPose: number
  onDD: (rank: number) => void
  onVina: (pose: number) => void
}

/** Pick which DiffDock / Vina pose is drawn; each chip is coloured by its RMSD to the crystal. */
export function PoseChips({ detail, ddRank, vPose, onDD, onVina }: Props) {
  const d = detail.diffdock.find(p => p.rank === ddRank)
  const v = detail.vina.find(p => p.pose === vPose)
  return (
    <div className="box cxposes">
      <div className="pgrp">
        <div className="pl2"><b>DiffDock</b><small>posição por confiança</small></div>
        <div className="pchips">
          {detail.diffdock.map(p => <Chip key={p.rank} n={p.rank} rmsd={p.rmsd} selected={p.rank === ddRank} onClick={() => onDD(p.rank)} />)}
          {!detail.diffdock.length && <span className="note">sem poses ainda</span>}
        </div>
      </div>
      <div className="pgrp">
        <div className="pl2"><b>Vina</b><small>seed 1, por score</small></div>
        <div className="pchips">
          {detail.vina.map(p => <Chip key={p.pose} n={p.pose} rmsd={p.rmsd} selected={p.pose === vPose} onClick={() => onVina(p.pose)} />)}
          {!detail.vina.length && <span className="note">sem poses ainda</span>}
        </div>
      </div>
      <div className="pinfo">
        {d && (
          <span>
            <b>DiffDock, posição {d.rank}:</b> {f2(d.rmsd)} Å, {how(d.rmsd)}
            {d.confidence !== null && <> · confiança {f2(d.confidence)}</>}.{' '}
            {d.rank === 1 ? 'É a pose que o DiffDock escolheria.' : 'O DiffDock escolheria a posição 1.'}
          </span>
        )}
        {v && (
          <span>
            <b>Vina, pose {v.pose}:</b> {f2(v.rmsd)} Å, {how(v.rmsd)} · score {f2(v.score)} kcal/mol.{' '}
            {v.pose === 1 ? 'É a pose que o Vina escolheria.' : 'O Vina escolheria a pose 1.'}
          </span>
        )}
      </div>
    </div>
  )
}
