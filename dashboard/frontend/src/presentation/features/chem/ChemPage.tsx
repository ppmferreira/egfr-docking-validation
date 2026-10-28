import { Box, Pad } from '../../ui/Box'
import { Page } from '../../ui/Layout'
import { Lead } from '../../ui/Text'

export default function ChemPage() {
  return (
    <Page>
      <Lead>Espaço químico dos compostos do ChEMBL: peso molecular contra logP, colorido pela potência (pIC50).</Lead>
      <Box><Pad><img className="block h-auto max-w-full rounded bg-white" src="/api/figures/egfr_chemical_space.png" alt="Espaço químico dos compostos de EGFR" /></Pad></Box>
    </Page>
  )
}
