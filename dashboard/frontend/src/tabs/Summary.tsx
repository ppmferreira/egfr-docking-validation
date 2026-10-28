import type { Dashboard } from '../api'
import { Answer, Box } from '../components/Answer'
import { ago, f2 } from '../lib/format'
import { verdict } from '../lib/summary'
import type { TabId } from '../nav'

const GLOSSARY: [string, string][] = [
  ['EGFR e erlotinibe', 'A EGFR é uma proteína da superfície das células. Quando fica hiperativa, pode estimular a multiplicação de tumores. O erlotinibe é um fármaco que se encaixa num bolsão dela e a desliga.'],
  ['Docking e score', 'Docking é o programa (aqui, AutoDock Vina) que tenta encaixar uma molécula no bolsão da proteína. O score, em kcal/mol, é a nota do encaixe: quanto mais negativo, melhor o encaixe previsto. Não é afinidade medida.'],
  ['IC50 e pIC50', 'IC50 é a concentração de uma molécula que inibe metade da proteína em laboratório. pIC50 é uma escala mais fácil de ler: quanto maior, mais potente. Acima de 7 é potente.'],
  ['RMSD', 'Distância média, em Ångströms (Å), entre os átomos da pose prevista e os da pose real no cristal. Até 2 Å conta como acerto. Um Å é cerca do tamanho de um átomo.'],
  ['Redocking', 'Teste de sanidade: tirar o fármaco da proteína, pedir ao programa para recolocá-lo sem dizer onde, e comparar com a posição real. Se ele não acerta o caso conhecido, não dá para confiar nos casos desconhecidos.'],
  ['Pose 1 e pose melhor', 'O Vina devolve 9 poses ordenadas pelo score. A pose 1 é a de maior score, e é a que vale para a validação. A "melhor pose" é a mais próxima do cristal, em qualquer posição do ranking.'],
]

export default function Summary({ data, go }: { data: Dashboard; go: (t: TabId) => void }) {
  const v = verdict(data), top = data.redocking?.poses[0]
  const link = (id: string): TabId | null => (id === '04' ? 'dock' : id === '02' ? 'chem' : id.startsWith('04') ? 'valid' : null)
  const facts: [string, string][] = [
    ['236', 'compostos do ChEMBL (únicos)'],
    ['16', 'compostos no docking'],
    [top ? `${f2(top.rmsd)} Å` : '–', 'RMSD da pose 1 no erlotinibe'],
    [`${v.nOk}/${v.ms.length || 3}`, 'complexos que acertaram (caixa 20 Å)'],
    [`${data.sweep.rows.length}/${data.sweep.total}`, 'execuções da varredura'],
    [`${data.multi.rows.length}/${data.multi.total}`, 'execuções em outros complexos'],
  ]
  return (
    <section>
      {v.okAll
        ? <Answer kind="ok" chip="Validado">O protocolo acertou a pose cristalográfica em <b>todos os complexos testados</b>. Os scores dos compostos ficam interpretáveis, ainda com cautela.</Answer>
        : <Answer kind="fail" chip="Não validado">
            O protocolo de docking <b>ainda não reproduz de forma confiável</b> a pose cristalográfica dos fármacos conhecidos.{' '}
            {top && <>No erlotinibe, a pose 1 ficou a <b>{f2(top.rmsd)} Å</b> do cristal (limite 2 Å). </>}
            {v.ms.length > 0 && <>Em {v.ms.length} complexos com a caixa de 20 Å, <b>{v.nOk}</b> passaram. </>}
            Enquanto isso, os scores dos 16 compostos não devem ser interpretados.{' '}
            <a href="#valid" onClick={e => { e.preventDefault(); go('valid') }}>Ver a validação</a>
          </Answer>}
      <div className="grid">
        <Box title="Etapas do projeto">
          <ul className="steps">
            {data.steps.map(s => {
              const running = !s.done && ((s.id === '04c' && data.sweep.rows.length > 0) || (s.id === '04d' && data.multi.rows.length > 0))
              const to = link(s.id)
              return (
                <li key={s.id}><code>{s.id}</code>
                  <span>{to ? <a href={`#${to}`} onClick={e => { e.preventDefault(); go(to) }}>{s.name}</a> : s.name}</span>
                  <span className={`tag ${s.done ? 'ok' : running ? 'run' : 'no'}`}>{s.done ? 'concluído' : running ? 'rodando' : 'pendente'}</span>
                </li>
              )
            })}
          </ul>
        </Box>
        <div style={{ display: 'grid', gap: 16 }}>
          <Box title="Números principais"><div className="facts">{facts.map(([n, l]) => <div className="fact" key={l}><b>{n}</b><span>{l}</span></div>)}</div></Box>
          <Box title="Atividade recente">
            <ul className="act">
              {data.activity.map(a => <li key={a.file}><span className="f">{a.file}</span><span className="age">{ago(a.age)}</span></li>)}
              {!data.activity.length && <li>Sem arquivos ainda.</li>}
            </ul>
          </Box>
        </div>
      </div>
      <Box title="Glossário (clique para abrir)">
        {GLOSSARY.map(([t, d]) => <details key={t}><summary>{t}</summary><div>{d}</div></details>)}
      </Box>
    </section>
  )
}
