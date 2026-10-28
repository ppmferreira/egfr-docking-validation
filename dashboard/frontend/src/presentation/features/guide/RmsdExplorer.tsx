import { useState } from 'react'
import type { Findings } from '../../../domain/findings'
import { HIT_THRESHOLD, NEAR_THRESHOLD, classify } from '../../../domain/rmsd'
import { f2 } from '../../format'
import { cn } from '../../ui/cn'
import { PageSection } from '../../ui/PageSection'
import { Slider } from '../../ui/Slider'
import { tone, toneBorder } from '../../ui/tone'

const MAX = 8
const TEXT = {
  ok: ['Acerto', 'A molécula está praticamente no mesmo lugar e com a mesma orientação que no cristal.'],
  near: ['Perto', 'Está no lugar certo, mas girada ou deslocada. Não conta como acerto.'],
  bad: ['Errou', 'Está em outro lugar do bolsão, invertida, ou fora dele.'],
} as const
const TICKS = [0, 2, 3, 4, 6, 8]

/** The yardstick used across the panel. Drag it, or jump to a real result of this project. */
export function RmsdExplorer({ f }: { f: Findings }) {
  const [value, setValue] = useState(1)
  const verdict = classify(value)
  const pct = (v: number) => `${(100 * v) / MAX}%`
  const rail = `linear-gradient(to right, color-mix(in srgb, var(--pass) 60%, transparent) 0 ${pct(HIT_THRESHOLD)}, color-mix(in srgb, var(--warn) 60%, transparent) ${pct(HIT_THRESHOLD)} ${pct(NEAR_THRESHOLD)}, color-mix(in srgb, var(--fail) 60%, transparent) ${pct(NEAR_THRESHOLD)} 100%)`
  return (
    <PageSection id="rmsd" title="Como saber se um encaixe está certo"
      intro={<>Medimos o <b className="text-ink">RMSD</b>: a distância média, em Ångströms (Å), entre cada átomo da molécula prevista e o mesmo átomo no cristal. 1 Å é 0,1 nanômetro; uma ligação entre dois carbonos mede cerca de 1,5 Å.</>}>
      <div className="grid gap-4 rounded-lg border border-line bg-panel p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <div className="min-w-32">
            <div className="text-[34px] leading-none tracking-[-0.03em]">{f2(value)} <span className="text-base text-muted">Å</span></div>
            <div className={cn('font-semibold', tone(verdict))}>{TEXT[verdict][0]}</div>
          </div>
          <p className="m-0 max-w-[52ch] text-muted">{TEXT[verdict][1]}</p>
        </div>
        <div className="px-2.5 pb-6">
          <Slider value={value} min={0} max={MAX} step={0.01} onChange={setValue} label="RMSD em Ångströms" railStyle={{ background: rail }} thumbClassName={toneBorder(verdict)} />
          <div className="relative mt-1 h-4 font-mono text-xs text-muted" aria-hidden>
            {TICKS.map(t => <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>{t}</span>)}
          </div>
        </div>
        {f.scaleExamples.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-muted">Resultados reais deste projeto:</span>
            {f.scaleExamples.map(e => (
              <button key={e.label} type="button" onClick={() => setValue(Math.min(MAX, Math.round(e.rmsd * 100) / 100))}
                className={cn('cursor-pointer rounded-full border bg-transparent px-2.5 py-0.5 text-xs font-medium hover:bg-current/10', toneBorder(classify(e.rmsd)), tone(classify(e.rmsd)))}>
                {e.label} · {f2(e.rmsd)} Å
              </button>
            ))}
          </div>
        )}
        <p className="m-0 max-w-[78ch] text-[13px] text-muted">
          <b className="text-ink">Até 2 Å conta como acerto</b>, o limite mais usado na literatura de docking. É uma convenção, não uma lei: perto dele (1.8 ou 2.2 Å) a diferença é pequena.
        </p>
      </div>
    </PageSection>
  )
}
