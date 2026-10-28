import { Box } from '../../ui/Box'
import styles from './MethodNotes.module.css'

/** How each method was run, collapsed under the viewer. */
export function MethodNotes() {
  return (
    <Box>
      <details>
        <summary>Como cada método foi rodado</summary>
        <div className={styles.notes}>
          <p><b>Vina:</b> caixa de 20 Å centrada no ligante do cristal, exhaustiveness 32, 3 seeds. Os números da lista são a média do RMSD da pose 1 nas 3 execuções; o desenho usa a seed 1.</p>
          <p><b>DiffDock:</b> docking às cegas (sem informar o bolsão), 10 amostras, configuração padrão. Vale a pose de maior confiança.</p>
          <p><b>RMSD:</b> distância média entre os átomos pesados da pose prevista e os do ligante no cristal, sem realinhar. Até 2 Å conta como acerto.</p>
          <p><b>Cegos:</b> estruturas de EGFR por raios X publicadas desde 2022, com ligante de 18 a 70 átomos pesados ligado ao hinge e sem ligação covalente. Os critérios foram fixados antes de rodar (scripts/07_blind_select.py).</p>
        </div>
      </details>
    </Box>
  )
}
