import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import { useHashTab, type TabId } from '../application/routes'
import { useDashboard } from '../application/useDashboard'
import { AppShell } from './layout/AppShell'
import { Header } from './layout/Header'
import { Sidebar } from './layout/Sidebar'
import { Toast } from './layout/Toast'
import { Lead } from './ui/Text'
import { Pulse } from './ui/Dot'
import { TipProvider } from './ui/Tip'

const ComplexesPage = lazy(() => import('./features/complexes/ComplexesPage'))
const ValidationPage = lazy(() => import('./features/validation/ValidationPage'))
const DockingPage = lazy(() => import('./features/docking/DockingPage'))
const EnrichmentPage = lazy(() => import('./features/enrichment/EnrichmentPage'))
const ChemPage = lazy(() => import('./features/chem/ChemPage'))
const GuidePage = lazy(() => import('./features/guide/GuidePage'))
const SummaryPage = lazy(() => import('./features/summary/SummaryPage'))
const RoadmapPage = lazy(() => import('./features/roadmap/RoadmapPage'))
const LivePage = lazy(() => import('./features/live/LivePage'))

/** Chooses what to show; every screen's logic lives in the application layer, its look in its own feature folder. */
export default function App() {
  const { data, jobs, clock, offline, notice } = useDashboard()
  const [tab, go] = useHashTab()
  const header = useRef<HTMLDivElement>(null)

  // The sidebar and sticky panels sit below the header, whose height changes with the job list.
  useLayoutEffect(() => {
    const set = () => document.documentElement.style.setProperty('--barh', `${header.current?.offsetHeight ?? 72}px`)
    set()
    window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [jobs.length])

  const blind = data?.blind
  const blindDone = blind ? new Set(blind.rows.map(r => r.pdb)).size : 0
  const blindRunning = jobs.some(j => /^08/.test(j.name))
  const badge = (id: TabId) => {
    if (id === 'live') return jobs.length ? <Pulse /> : null
    if (id === 'cx' && blind?.selected.length) return <>{blindRunning && <><Pulse />&nbsp;</>}{blindDone}/{blind.selected.length}</>
    return null
  }

  const page = () => {
    if (!data) return <Lead>{offline ? 'O backend não respondeu. Rode: uvicorn app.main:app --port 8000 (em dashboard/backend).' : 'Carregando dados…'}</Lead>
    switch (tab) {
      case 'cx': return <ComplexesPage data={data} running={blindRunning} />
      case 'valid': return <ValidationPage data={data} />
      case 'dock': return <DockingPage data={data} />
      case 'enrich': return <EnrichmentPage data={data} />
      case 'chem': return <ChemPage data={data} />
      case 'guia': return <GuidePage data={data} onGo={go} />
      case 'resumo': return <SummaryPage data={data} onGo={go} />
      case 'next': return <RoadmapPage data={data} onGo={go} />
      case 'live': return <LivePage />
    }
  }

  return (
    <TipProvider>
      <Header ref={header} jobs={jobs} clock={clock} offline={offline} onOpenLive={() => go('live')} />
      <Toast message={notice} />
      <AppShell sidebar={<Sidebar current={tab} onGo={go} badge={badge} />}>
        <Suspense fallback={<Lead>Carregando…</Lead>}>{page()}</Suspense>
      </AppShell>
    </TipProvider>
  )
}
