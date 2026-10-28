import { countHits, finishedBlind, type Entry } from '../../../domain/benchmark'
import { Answer } from '../../ui/Answer'

/** Headline of the Complexos screen: how many complexes each method got right, development and blind. */
export function ResultsBanner({ entries, running }: { entries: Entry[]; running: boolean }) {
  const train = countHits(entries.filter(e => e.group === 'train'))
  const blindAll = entries.filter(e => e.group === 'blind')
  const blind = countHits(finishedBlind(entries))
  if (!train.n && !blind.n) return <Answer kind="no" chip="Sem resultado">Rode scripts/06_diffdock.py e scripts/04d_redock_multi.py.</Answer>
  return (
    <Answer kind={running ? 'warn' : 'ok'} chip={blind.n ? `${blind.n} de ${blindAll.length} cegos` : `${train.n} complexos`}>
      <b>Complexos de treino:</b> DiffDock acertou {train.diffdock} de {train.n}, Vina {train.vina} de {train.n}.{' '}
      {blind.n > 0 && <><b>Complexos novos (cegos):</b> DiffDock {blind.diffdock} de {blind.n}, Vina {blind.vina} de {blind.n}{running ? ', ainda rodando' : ''}. </>}
      Acertar é ficar a até 2 Å do cristal. O Vina recebe a posição do bolsão; o DiffDock procura na proteína inteira.
    </Answer>
  )
}
