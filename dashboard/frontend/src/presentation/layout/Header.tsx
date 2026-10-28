import { forwardRef } from 'react'
import type { Job } from '../../domain/entities'
import { dur } from '../format'
import { Idle, Pulse } from '../ui/Dot'
import styles from './Header.module.css'

interface Props { jobs: Job[]; clock: string; offline: boolean; onOpenLive: () => void }

/** Sticky top bar: project name, connection clock and the pipeline jobs running right now. */
export const Header = forwardRef<HTMLDivElement, Props>(function Header({ jobs, clock, offline, onOpenLive }, ref) {
  return (
    <div className={styles.bar} ref={ref}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <h1>Triagem virtual de inibidores de EGFR</h1>
          <span className={styles.author}>Pedro Paulo de Melo Ferreira</span>
          <span className={styles.clock}>{offline ? 'sem conexão com o servidor' : clock ? `ao vivo · ${clock}` : 'carregando…'}</span>
        </div>
        <div className={styles.run} aria-live="polite">
          {jobs.length ? (
            <>
              <span>Em execução agora:</span>
              <a href="#live" onClick={e => { e.preventDefault(); onOpenLive() }}>ver ao vivo</a>
              {jobs.map(j => <span className={styles.job} key={j.name}><Pulse />{j.name} · {dur(j.seconds)}</span>)}
            </>
          ) : <span className={styles.job}><Idle />Nenhuma análise rodando · painel ao vivo</span>}
        </div>
      </div>
    </div>
  )
})
