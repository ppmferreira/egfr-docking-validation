import { useComplexExplorer } from '../../../application/useComplexExplorer'
import type { Dashboard } from '../../../domain/entities'
import { Box } from '../../ui/Box'
import { Page } from '../../ui/Layout'
import { Note } from '../../ui/Text'
import { ComplexHeader } from './ComplexHeader'
import { ComplexList } from './ComplexList'
import styles from './ComplexesPage.module.css'
import { MethodNotes } from './MethodNotes'
import { PoseChips } from './PoseChips'
import { ResultsBanner } from './ResultsBanner'
import { StructureViewer } from './StructureViewer'
import { TrajectoryPlayer } from './TrajectoryPlayer'

const HINT = 'arraste para girar · role para zoom · passe o mouse para ver nomes'
const ANIMATION_HINT = 'o ligante em ciano parte de uma posição aleatória até o encaixe'

/** All complexes in one place: the list on the left; on the right the 3D scene, pose pickers and the animation. */
export default function ComplexesPage({ data, running }: { data: Dashboard; running: boolean }) {
  const x = useComplexExplorer(data)
  const { detail, player } = x

  let playerLabel = ''
  if (player.missing) playerLabel = 'Sem trajetória salva para esta posição.'
  else if (player.distanceToCrystal !== null) playerLabel = `passo ${player.frame + 1} de ${player.total} · a ${player.distanceToCrystal.toFixed(1)} Å do cristal`

  return (
    <Page>
      <ResultsBanner entries={x.entries} running={running} />
      <div className={styles.work}>
        <ComplexList entries={x.entries} current={x.current} onPick={x.pick} />
        <div className={styles.main}>
          {x.entry && <ComplexHeader entry={x.entry} />}
          {x.failed && <Box padded><Note>Não foi possível montar este complexo (a estrutura do ligante não pôde ser reconstruída).</Note></Box>}
          {detail && (
            <>
              <StructureViewer detail={detail} layers={x.layers} ddRank={x.ddRank} vinaPose={x.vinaPose}
                trajectory={player.text} frame={player.frame} hint={player.text ? ANIMATION_HINT : HINT} onLayer={x.toggleLayer} />
              <PoseChips detail={detail} ddRank={x.ddRank} vinaPose={x.vinaPose} onDiffDock={x.chooseDiffDock} onVina={x.chooseVina} />
              {detail.has_traj && (
                <TrajectoryPlayer playing={player.playing} total={player.total} frame={player.frame} label={playerLabel}
                  onToggle={player.toggle} onSeek={player.seek} />
              )}
            </>
          )}
          {!detail && !x.failed && x.current && <Box padded><Note>Carregando {x.current}…</Note></Box>}
        </div>
      </div>
      <MethodNotes />
    </Page>
  )
}
