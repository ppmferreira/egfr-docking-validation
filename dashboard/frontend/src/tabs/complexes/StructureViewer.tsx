import { useEffect, useRef } from 'react'
import * as $3Dmol from '3dmol'
import type { ComplexDetail } from '../../api'

import { COLORS, type Layers } from './layers'

interface Props {
  detail: ComplexDetail
  layers: Layers
  ddRank: number
  vPose: number
  /** PDB text of DiffDock's trajectory; when set it replaces the static DiffDock pose. */
  trajectory: string | null
  frame: number
  hint: string
  onLayer: (k: keyof Layers) => void
}

type Viewer = ReturnType<typeof $3Dmol.createViewer>
const LAYER_BUTTONS: { key: keyof Layers; label: string; color?: string }[] = [
  { key: 'cry', label: 'Cristal', color: COLORS.cry },
  { key: 'dd', label: 'DiffDock', color: COLORS.dd },
  { key: 'vina', label: 'Vina', color: COLORS.vina },
  { key: 'res', label: 'Bolsão' },
]

export function StructureViewer({ detail, layers, ddRank, vPose, trajectory, frame, hint, onLayer }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const viewer = useRef<Viewer | null>(null)
  const ids = useRef<{ prot: number; cry: number; dd: number | null; vina: number | null }>({ prot: 0, cry: 0, dd: null, vina: null })
  const framedFor = useRef<string | null>(null)
  const frameRef = useRef(frame)
  useEffect(() => { frameRef.current = frame }, [frame])

  useEffect(() => {
    const el = host.current!
    viewer.current = $3Dmol.createViewer(el, { backgroundColor: '#0f1a21' })
    return () => { viewer.current = null; el.innerHTML = '' }
  }, [])

  const camera = (kind: 'pocket' | 'all') => {
    const v = viewer.current
    if (!v) return
    if (kind === 'all') { v.zoomTo({ model: [ids.current.prot] }); v.zoom(1.1) }
    else { v.zoomTo({ model: [ids.current.cry] }); v.zoom(0.62) }
    v.render()
  }

  useEffect(() => {
    const v = viewer.current
    if (!v) return
    v.removeAllModels(); v.removeAllLabels()
    const prot = v.addModel(detail.protein, 'pdb')
    const cry = v.addModel(detail.crystal, 'sdf')
    ids.current = { prot: prot.getID(), cry: cry.getID(), dd: null, vina: null }
    prot.setStyle({}, { cartoon: { color: '#7f929d', opacity: 0.5 } })
    if (layers.res) {
      const lig = cry.selectedAtoms({}), near = new Set<number>()
      prot.selectedAtoms({}).forEach(a => {
        if (a.resi !== undefined && !near.has(a.resi) && lig.some(l => Math.hypot(l.x! - a.x!, l.y! - a.y!, l.z! - a.z!) <= 4.5)) near.add(a.resi)
      })
      prot.setStyle({ resi: [...near] }, { cartoon: { color: '#7f929d', opacity: 0.5 }, stick: { radius: 0.1, colorscheme: 'greyCarbon' } })
    }
    cry.setStyle({}, layers.cry ? { stick: { radius: 0.2, color: COLORS.cry } } : {})
    if (trajectory) {
      const m = v.addModelsAsFrames(trajectory, 'pdb')
      m.setStyle({}, { stick: { radius: 0.22, color: COLORS.dd } })
      ids.current.dd = m.getID(); v.setFrame(frameRef.current)
    } else if (layers.dd) {
      const p = detail.diffdock.find(x => x.rank === ddRank)
      if (p) { const m = v.addModel(p.mol, 'sdf'); m.setStyle({}, { stick: { radius: 0.2, color: COLORS.dd } }); ids.current.dd = m.getID() }
    }
    if (layers.vina) {
      const p = detail.vina.find(x => x.pose === vPose)
      if (p) { const m = v.addModel(p.mol, 'sdf'); m.setStyle({}, { stick: { radius: 0.2, color: COLORS.vina } }); ids.current.vina = m.getID() }
    }
    let label: ReturnType<typeof v.addLabel> | null = null
    v.setHoverable({}, true, (a: $3Dmol.AtomSpec) => {
      if (label) v.removeLabel(label)
      const id = a.model
      const text = id === ids.current.cry ? 'Cristal (real)' : id === ids.current.dd ? `DiffDock · posição ${ddRank}`
        : id === ids.current.vina ? `Vina · pose ${vPose}` : `${a.resn} ${a.resi}`
      label = v.addLabel(text, { position: a as { x: number; y: number; z: number }, fontSize: 12, fontColor: '#e6edf0',
        backgroundColor: '#0a1116', backgroundOpacity: 0.85, borderColor: '#46586a', borderThickness: 1, inFront: true })
      v.render()
    }, () => { if (label) { v.removeLabel(label); label = null; v.render() } })
    if (framedFor.current !== detail.pdb) {
      framedFor.current = detail.pdb
      v.resize(); camera('pocket')
      // The canvas only reaches its final size after layout; frame again once it has.
      requestAnimationFrame(() => { viewer.current?.resize(); camera('pocket') })
    } else v.render()
  }, [detail, layers, ddRank, vPose, trajectory])

  useEffect(() => {
    if (trajectory && viewer.current) { viewer.current.setFrame(frame); viewer.current.render() }
  }, [frame, trajectory])

  useEffect(() => {
    if (trajectory) camera('all')
  }, [trajectory])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const ro = new ResizeObserver(() => { viewer.current?.resize(); viewer.current?.render() })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="stage cxstage">
      <div ref={host} id="vcx" />
      <div className="vtools" role="toolbar" aria-label="Camadas">
        {LAYER_BUTTONS.map(b => (
          <button key={b.key} type="button" aria-pressed={layers[b.key]} onClick={() => onLayer(b.key)}>
            {b.color && <i style={{ background: b.color }} />}{b.label}
          </button>
        ))}
      </div>
      <div className="vtools vcam" role="toolbar" aria-label="Câmera">
        <button type="button" onClick={() => camera('pocket')}>Bolsão</button>
        <button type="button" onClick={() => camera('all')}>Proteína inteira</button>
      </div>
      <div className="hint">{hint}</div>
    </div>
  )
}
