import { Box } from '../components/Answer'

export default function Chem() {
  return (
    <section>
      <p className="lead">Espaço químico dos compostos do ChEMBL: peso molecular contra logP, colorido pela potência (pIC50).</p>
      <Box><div className="pad"><img className="fig" src="/api/figures/egfr_chemical_space.png" alt="Espaço químico dos compostos de EGFR" /></div></Box>
    </section>
  )
}
