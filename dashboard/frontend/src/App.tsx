import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDashboard } from './hooks/useDashboard'
import { dur } from './lib/format'
import { isTab, TAB_GROUPS, TAB_TITLES, type TabId } from './nav'
import Chem from './tabs/Chem'
import ComplexesTab from './tabs/complexes/ComplexesTab'
import Docking from './tabs/Docking'
import Guide from './tabs/Guide'
import Live from './tabs/Live'
import Roadmap from './tabs/Roadmap'
import Summary from './tabs/Summary'
import Validation from './tabs/Validation'

function useHashTab(): [TabId, (t: TabId) => void] {
  const read = (): TabId => { const h = location.hash.slice(1); return isTab(h) ? h : 'cx' }
  const [tab, setTab] = useState<TabId>(read)
  useEffect(() => {
    const on = () => setTab(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (t: TabId) => { location.hash = t; window.scrollTo(0, 0) }
  return [tab, go]
}

export default function App() {
  const { data, jobs, clock, offline, notice } = useDashboard()
  const [tab, go] = useHashTab()
  const bar = useRef<HTMLDivElement>(null)

  // The sidebar and sticky panels sit below the header, whose height changes with the job list.
  useLayoutEffect(() => {
    const set = () => document.documentElement.style.setProperty('--barh', `${bar.current?.offsetHeight ?? 72}px`)
    set()
    window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [jobs.length])

  const blind = data?.blind
  const blindDone = blind ? new Set(blind.rows.map(r => r.pdb)).size : 0
  const blindRunning = jobs.some(j => /^08/.test(j.name))
  const badge = (id: TabId) => {
    if (id === 'live') return jobs.length ? <i className="pulse" /> : null
    if (id === 'cx' && blind?.selected.length) return <>{blindRunning && <><i className="pulse" />&nbsp;</>}{blindDone}/{blind.selected.length}</>
    return null
  }

  return (
    <>
      <div className="bar" ref={bar}><div className="in">
        <div className="top">
          <h1>Triagem virtual de inibidores de EGFR</h1>
          <span className="by">Pedro Paulo de Melo Ferreira</span>
          <span className="live">{offline ? 'sem conexão com o servidor' : clock ? `ao vivo · ${clock}` : 'carregando…'}</span>
        </div>
        <div className="run" aria-live="polite">
          {jobs.length
            ? <><span>Em execução agora:</span><a href="#live" onClick={e => { e.preventDefault(); go('live') }}>ver ao vivo</a>
                {jobs.map(j => <span className="job" key={j.name}><i className="pulse" />{j.name} · {dur(j.seconds)}</span>)}</>
            : <span className="job"><i className="idle" />Nenhuma análise rodando · painel ao vivo</span>}
        </div>
      </div></div>
      <div className={`toast ${notice ? 'on' : ''}`} role="status">{notice && `Atualizado: ${notice.toLowerCase()}`}</div>
      <div className="shell">
        <nav role="tablist" aria-label="Seções do painel">
          {TAB_GROUPS.map(([name, ids]) => (
            <div className="grp" key={name}>
              <div className="gt">{name}</div>
              {ids.map(id => (
                <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => go(id)}>
                  <span>{TAB_TITLES[id]}</span><i className="bd">{badge(id)}</i>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <main>
          {!data ? <p className="lead">{offline ? 'O backend não respondeu. Rode: uvicorn app.main:app --port 8000 (em dashboard/backend).' : 'Carregando dados…'}</p>
            : tab === 'cx' ? <ComplexesTab data={data} running={blindRunning} />
            : tab === 'valid' ? <Validation data={data} />
            : tab === 'dock' ? <Docking data={data} />
            : tab === 'chem' ? <Chem />
            : tab === 'guia' ? <Guide data={data} go={go} />
            : tab === 'resumo' ? <Summary data={data} go={go} />
            : tab === 'next' ? <Roadmap go={go} />
            : <Live />}
        </main>
      </div>
    </>
  )
}
