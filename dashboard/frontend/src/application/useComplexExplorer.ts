import { useEffect, useMemo, useState } from 'react'
import { listComplexes } from '../domain/benchmark'
import type { Dashboard } from '../domain/entities'
import { DEFAULT_LAYERS, type Layers } from '../domain/layers'
import { useComplexDetail } from './useComplexDetail'
import { useTrajectoryPlayer } from './useTrajectoryPlayer'

/** State and actions of the Complexos screen: which complex, which poses, which layers, and the animation. */
export function useComplexExplorer(data: Dashboard) {
  const entries = useMemo(() => listComplexes(data), [data])
  const [picked, setPicked] = useState<string | null>(null)
  const current = picked ?? entries.find(e => !e.pending && !e.skipped)?.pdb ?? null
  const entry = entries.find(e => e.pdb === current) ?? null

  // Re-read the structure when a blind-test run adds rows for it.
  const rowsKey = data.blind.rows.filter(r => r.pdb === current).length
  const { detail, failed } = useComplexDetail(current, rowsKey)

  const [ddChoice, setDDChoice] = useState(1)
  const [vinaPose, setVinaPose] = useState(1)
  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS)

  const ddRank = detail?.diffdock.some(p => p.rank === ddChoice) ? ddChoice : detail?.diffdock[0]?.rank ?? 1
  const player = useTrajectoryPlayer(current, ddRank, !!detail?.has_traj, detail?.center)

  const pick = (pdb: string) => {
    if (pdb === current) return
    player.reset(); setPicked(pdb); setDDChoice(1); setVinaPose(1)
  }
  const chooseDiffDock = (rank: number) => { player.stop(); setDDChoice(rank); setLayers(l => ({ ...l, dd: true })) }
  const chooseVina = (pose: number) => { setVinaPose(pose); setLayers(l => ({ ...l, vina: true })) }
  const toggleLayer = (k: keyof Layers) => { if (k === 'dd') player.stop(); setLayers(l => ({ ...l, [k]: !l[k] })) }

  // ← → step through the DiffDock poses.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!detail || !detail.diffdock.length || /^(INPUT|SELECT|TEXTAREA)$/.test((e.target as HTMLElement).tagName)) return
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      e.preventDefault()
      const n = detail.diffdock.length, i = detail.diffdock.findIndex(p => p.rank === ddRank)
      chooseDiffDock(detail.diffdock[(i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n].rank)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return { entries, current, entry, detail, failed, ddRank, vinaPose, layers, player, pick, chooseDiffDock, chooseVina, toggleLayer }
}
