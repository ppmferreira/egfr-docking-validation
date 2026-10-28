import { Beaker, FlaskConical, Pill, Scale } from 'lucide-react'
import { useMemo, useState } from 'react'
import { POTENCY, summarizeChemistry, type PotencyId } from '../../../domain/compounds'
import type { Dashboard } from '../../../domain/entities'
import { Answer } from '../../ui/Answer'
import { Box, Pad } from '../../ui/Box'
import { Page } from '../../ui/Layout'
import { PageSection } from '../../ui/PageSection'
import { Stat } from '../../ui/Stat'
import { Takeaway } from '../../ui/Takeaway'
import { cn } from '../../ui/cn'
import { ChemScatter } from './ChemScatter'
import { PotencyHistogram } from './PotencyHistogram'
import { POTENCY_COLOR } from './potency'

const fmt = (v: number | null) => (v === null ? '–' : v.toFixed(2).replace('-', '−'))

export default function ChemPage({ data }: { data: Dashboard }) {
  const s = useMemo(() => summarizeChemistry(data.compounds), [data.compounds])
  const docked = useMemo(() => new Set(data.docking.map(d => d.chembl_id)), [data.docking])
  const [shown, setShown] = useState<Set<PotencyId>>(() => new Set(POTENCY.map(p => p.id)))
  const toggle = (id: PotencyId) => setShown(cur => {
    const next = new Set(cur)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next.size ? next : cur
  })
  if (!s.n) return <Page><Answer kind="warn" chip="Aguardando">A lista de compostos curados ainda não existe.</Answer></Page>
  const pct = Math.round(100 * s.lipinski / s.n)
  return (
    <Page className="gap-8">
      <Answer kind="no" chip="O que é">
        Os <b>{s.n} compostos de EGFR</b> do ChEMBL que sobraram depois da curadoria, cada um com a potência medida em laboratório. Esta tela mostra que tipo de molécula é essa biblioteca: tamanho, lipofilicidade e potência.
      </Answer>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        <Stat icon={<FlaskConical />} label="Compostos" value={s.n} caption="Com IC50 medido contra o EGFR." />
        <Stat icon={<Beaker />} label="Muito potentes" value={s.byPotency.high} caption={<>IC50 abaixo de 10 nM (pIC50 ≥ 8), {Math.round(100 * s.byPotency.high / s.n)}% da lista.</>} />
        <Stat icon={<Pill />} label="Dentro da regra de Lipinski" value={`${pct}%`} caption={<>{s.lipinski} compostos com massa até 500 Da e logP até 5, o perfil típico de remédio oral.</>} />
        <Stat icon={<Scale />} label="Faixa de massa" value={<>{Math.round(s.mw.min)}–{Math.round(s.mw.max)}</>} caption={`Da. O logP vai de ${s.logP.min.toFixed(1)} a ${s.logP.max.toFixed(1)}.`} />
      </div>

      <PageSection title="Onde cada composto fica"
        intro={<>Cada ponto é um composto. Quanto mais forte a cor, mais potente o composto. A área verde é onde a regra de Lipinski é atendida. Losangos laranja são os 16 compostos que já passaram pelo docking. Passe o mouse para ver o código ChEMBL.</>}>
        <Box>
          <Pad className="grid gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Faixas de potência exibidas">
              {POTENCY.map(p => (
                <button key={p.id} type="button" aria-pressed={shown.has(p.id)} onClick={() => toggle(p.id)}
                  className={cn('inline-flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1 text-[12.5px] transition-colors',
                    shown.has(p.id) ? 'border-ink/40 bg-paper text-ink' : 'border-line bg-transparent text-muted opacity-60')}>
                  <i className="size-2.5 rounded-full" style={{ background: POTENCY_COLOR[p.id] }} />
                  <span className="font-medium">{p.label}</span>
                  <span className="text-muted">{p.hint} · {s.byPotency[p.id]}</span>
                </button>
              ))}
            </div>
            <ChemScatter compounds={data.compounds} shown={shown} docked={docked} />
          </Pad>
        </Box>
        <Takeaway>
          A maioria ({pct}%) cabe na regra de Lipinski. A potência quase não se relaciona com o tamanho (ρ = {fmt(s.corr.mw)}) nem com o logP (ρ = {fmt(s.corr.logP)}): os compostos mais potentes estão espalhados por todo o gráfico, então essas duas medidas sozinhas não dizem quem inibe melhor.
        </Takeaway>
      </PageSection>

      <PageSection title="Quão potentes são"
        intro="Quantos compostos há em cada faixa de pIC50 (pIC50 = −log10 do IC50 em mol/L; 7 equivale a 100 nM e 9, a 1 nM).">
        <Box><Pad><PotencyHistogram bins={s.histogram} /></Pad></Box>
      </PageSection>
    </Page>
  )
}
