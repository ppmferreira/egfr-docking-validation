import type { Dashboard } from '../../../domain/entities'
import { f2 } from '../../format'
import { Answer } from '../../ui/Answer'
import { Box, Pad } from '../../ui/Box'
import { Grid, Page } from '../../ui/Layout'
import { TableWrap } from '../../ui/TableWrap'
import { ScoreScatter } from './ScoreScatter'

export default function DockingPage({ data }: { data: Dashboard }) {
  const rows = [...data.docking].sort((a, b) => a.vina_score_kcal_mol - b.vina_score_kcal_mol)
  return (
    <Page>
      <Answer kind="warn" chip="Cuidado">Estes scores <b>ainda não são confiáveis</b>, porque o protocolo não foi validado. Servem para estudar o fluxo, não para concluir qual composto é melhor.</Answer>
      <Grid>
        <Box title="Score do Vina × pIC50"><Pad><ScoreScatter rows={data.docking} /></Pad></Box>
        <Box title="16 compostos, do melhor ao pior score">
          <TableWrap><table className="data-table">
            <thead><tr><th>ChEMBL</th><th>Score</th><th>pIC50</th><th>IC50 nM</th></tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.chembl_id}><td>{r.chembl_id}</td><td>{f2(r.vina_score_kcal_mol)}</td><td>{f2(r.pIC50)}</td>
                <td>{r.ic50_nM >= 1000 ? Math.round(r.ic50_nM) : r.ic50_nM.toPrecision(3)}</td></tr>
            ))}</tbody>
          </table></TableWrap>
        </Box>
      </Grid>
    </Page>
  )
}
