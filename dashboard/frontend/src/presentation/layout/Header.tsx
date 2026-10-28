import { forwardRef } from 'react'
import type { Job } from '../../domain/entities'
import { dur } from '../format'
import { Idle, Pulse } from '../ui/Dot'

interface Props { jobs: Job[]; clock: string; offline: boolean; onOpenLive: () => void }

/** Sticky top bar: project name, connection clock and the pipeline jobs running right now. */
export const Header = forwardRef<HTMLDivElement, Props>(function Header({ jobs, clock, offline, onOpenLive }, ref) {
  return (
    <div ref={ref} className="sticky top-0 z-5 border-b border-line bg-panel">
      <div className="mx-auto max-w-[1180px] px-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 pt-3">
          <h1 className="m-0 text-[17px] font-semibold tracking-tight">Triagem virtual de inibidores de EGFR</h1>
          <span className="text-xs text-muted">Pedro Paulo de Melo Ferreira</span>
          <span className="ml-auto font-mono text-[11px] text-muted">{offline ? 'sem conexão com o servidor' : clock ? `ao vivo · ${clock}` : 'carregando…'}</span>
        </div>
        <div aria-live="polite" className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-[7px] pb-[9px] font-mono text-xs text-muted">
          {jobs.length ? (
            <>
              <span>Em execução agora:</span>
              <a href="#live" onClick={e => { e.preventDefault(); onOpenLive() }}>ver ao vivo</a>
              {jobs.map(j => <span key={j.name} className="inline-flex items-center gap-[7px] text-ink"><Pulse />{j.name} · {dur(j.seconds)}</span>)}
            </>
          ) : <span className="inline-flex items-center gap-[7px] text-ink"><Idle />Nenhuma análise rodando · painel ao vivo</span>}
        </div>
      </div>
    </div>
  )
})
