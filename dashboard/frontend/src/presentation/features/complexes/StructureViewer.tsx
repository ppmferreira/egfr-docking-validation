import { useEffect, useRef } from 'react'
import type { ComplexDetail } from '../../../domain/entities'
import type { Layers } from '../../../domain/layers'
import { ComplexViewer } from '../../../infrastructure/viewer/ComplexViewer'
import { PALETTE } from '../../theme/palette'
import styles from './StructureViewer.module.css'

interface Props {
  detail: ComplexDetail
  layers: Layers
  ddRank: number
  vinaPose: number
  trajectory: string | null
  frame: number
  hint: string
  onLayer: (k: keyof Layers) => void
}

const LAYER_BUTTONS: { key: keyof Layers; label: string; color?: string }[] = [
  { key: 'cry', label: 'Cristal', color: PALETTE.cry },
  { key: 'dd', label: 'DiffDock', color: PALETTE.dd },
  { key: 'vina', label: 'Vina', color: PALETTE.vina },
  { key: 'res', label: 'Bolsão' },
]

/** Hosts the 3D canvas and the buttons over it; drawing itself is done by the ComplexViewer adapter. */
export function StructureViewer({ detail, layers, ddRank, vinaPose, trajectory, frame, hint, onLayer }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const viewer = useRef<ComplexViewer | null>(null)
  const frameRef = useRef(frame)
  useEffect(() => { frameRef.current = frame }, [frame])

  useEffect(() => {
    viewer.current = new ComplexViewer(host.current!, PALETTE)
    return () => { viewer.current?.dispose(); viewer.current = null }
  }, [])

  useEffect(() => {
    viewer.current?.render({ detail, layers, ddRank, vinaPose, trajectory, frame: frameRef.current })
  }, [detail, layers, ddRank, vinaPose, trajectory])

  useEffect(() => { if (trajectory) viewer.current?.setFrame(frame) }, [frame, trajectory])
  useEffect(() => { if (trajectory) viewer.current?.camera('all') }, [trajectory])

  return (
    <div className={styles.stage}>
      <div ref={host} className={styles.canvas} />
      <div className={styles.tools} role="toolbar" aria-label="Camadas">
        {LAYER_BUTTONS.map(b => (
          <button key={b.key} type="button" aria-pressed={layers[b.key]} onClick={() => onLayer(b.key)}>
            {b.color && <i style={{ background: b.color }} />}{b.label}
          </button>
        ))}
      </div>
      <div className={`${styles.tools} ${styles.camera}`} role="toolbar" aria-label="Câmera">
        <button type="button" onClick={() => viewer.current?.camera('pocket')}>Bolsão</button>
        <button type="button" onClick={() => viewer.current?.camera('all')}>Proteína inteira</button>
      </div>
      <div className={styles.hint}>{hint}</div>
    </div>
  )
}
