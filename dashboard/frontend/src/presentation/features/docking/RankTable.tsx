import type { RankedCompound } from '../../../domain/ranking'
import { f2 } from '../../format'
import { cn } from '../../ui/cn'
import { TableWrap } from '../../ui/TableWrap'

function Bar({ pct, className }: { pct: number; className: string }) {
  return <span className="inline-block h-1.5 w-20 overflow-hidden rounded-full bg-line align-middle"><span className={cn('block h-full rounded-full', className)} style={{ width: `${Math.max(4, pct)}%` }} /></span>
}

/** How far the Vina order is from the potency order: 0 = same place, otherwise how many places off. */
const gapTone = (d: number) => (Math.abs(d) <= 2 ? 'text-pass' : Math.abs(d) <= 5 ? 'text-warn' : 'text-fail')

export function RankTable({ rows }: { rows: RankedCompound[] }) {
  const worst = Math.max(...rows.map(r => -r.vina_score_kcal_mol)), lo = Math.min(...rows.map(r => r.pIC50)), hi = Math.max(...rows.map(r => r.pIC50))
  return (
    <TableWrap>
      <table className="data-table">
        <thead><tr><th>Composto</th><th>Posição pelo Vina</th><th>Score</th><th>Posição pela potência</th><th>pIC50</th><th>Diferença</th></tr></thead>
        <tbody>
          {rows.map(r => {
            const gap = r.potencyRank - r.scoreRank
            return (
              <tr key={r.chembl_id}>
                <td>{r.chembl_id}</td>
                <td>{r.scoreRank}º</td>
                <td><span className="mr-2">{f2(r.vina_score_kcal_mol)}</span><Bar pct={100 * -r.vina_score_kcal_mol / worst} className="bg-vina" /></td>
                <td>{r.potencyRank}º</td>
                <td><span className="mr-2">{f2(r.pIC50)}</span><Bar pct={100 * (r.pIC50 - lo) / (hi - lo || 1)} className="bg-docked" /></td>
                <td className={gapTone(gap)}>{gap === 0 ? '=' : gap > 0 ? `+${gap}` : gap}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </TableWrap>
  )
}
