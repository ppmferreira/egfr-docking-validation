import { Download } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useRendererFactory } from '../../../application/servicesContext'
import type { ComplexDetail } from '../../../domain/entities'
import type { Layers } from '../../../domain/layers'
import type { StructureRenderer } from '../../../domain/rendering'
import { PALETTE } from '../../theme/palette'

interface Props {
  detail: ComplexDetail
  layers: Layers
  ddRank: number
  vinaSeed: number
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

const TOOL = 'inline-flex cursor-pointer items-center gap-[7px] rounded border border-[#2b3943] bg-[rgba(10,17,22,.8)] px-2.5 py-[5px] text-[12.5px] font-medium text-[#9fb0b9] hover:border-[#586c78] hover:text-white aria-pressed:border-[#586c78] aria-pressed:text-white'

/** Hosts the 3D canvas and the buttons over it; drawing itself is done by the injected renderer. */
export function StructureViewer({ detail, layers, ddRank, vinaSeed, vinaPose, trajectory, frame, hint, onLayer }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const createRenderer = useRendererFactory()
  const viewer = useRef<StructureRenderer | null>(null)
  const frameRef = useRef(frame)
  useEffect(() => { frameRef.current = frame }, [frame])

  useEffect(() => {
    viewer.current = createRenderer(host.current!, PALETTE)
    return () => { viewer.current?.dispose(); viewer.current = null }
  }, [createRenderer])

  useEffect(() => {
    viewer.current?.render({ detail, layers, ddRank, vinaSeed, vinaPose, trajectory, frame: frameRef.current })
  }, [detail, layers, ddRank, vinaSeed, vinaPose, trajectory])

  useEffect(() => { if (trajectory) viewer.current?.setFrame(frame) }, [frame, trajectory])
  useEffect(() => { if (trajectory) viewer.current?.camera('all') }, [trajectory])

  const savePng = () => {
    const uri = viewer.current?.snapshot()
    if (!uri) return
    const a = document.createElement('a')
    a.href = uri; a.download = `${detail.pdb}.png`; a.click()
  }

  return (
    <div className="relative h-[clamp(420px,calc(100vh-var(--barh,72px)-330px),720px)] overflow-hidden rounded-lg bg-stage max-[1180px]:h-[440px]">
      <div ref={host} className="absolute inset-0" />
      <div role="toolbar" aria-label="Camadas" className="absolute top-2.5 left-3 z-2 flex flex-wrap gap-1.5">
        {LAYER_BUTTONS.map(b => (
          <button key={b.key} type="button" aria-pressed={layers[b.key]} onClick={() => onLayer(b.key)} className={`${TOOL} group`}>
            {b.color && <i className="size-2.5 rounded-sm opacity-45 group-aria-pressed:opacity-100" style={{ background: b.color }} />}{b.label}
          </button>
        ))}
      </div>
      <div role="toolbar" aria-label="Câmera" className="absolute right-3 bottom-2.5 z-2 flex flex-wrap gap-1.5">
        <button type="button" className={TOOL} onClick={() => viewer.current?.camera('pocket')}>Bolsão</button>
        <button type="button" className={TOOL} onClick={() => viewer.current?.camera('all')}>Proteína inteira</button>
        <button type="button" className={TOOL} onClick={savePng} title="Baixa a imagem do 3D como PNG"><Download className="size-3.5" aria-hidden />Salvar PNG</button>
      </div>
      <div className="pointer-events-none absolute top-2.5 right-3 font-mono text-[11px] text-[#7f929d]">{hint}</div>
    </div>
  )
}
