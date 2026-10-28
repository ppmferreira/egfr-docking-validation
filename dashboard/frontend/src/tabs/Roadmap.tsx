import { Box } from '../components/Answer'
import type { TabId } from '../nav'

const ROAD: { title: string; why: string; link?: TabId; status: 'em andamento' | 'pendente' }[] = [
  { title: 'Validar o protocolo em mais de um complexo', why: 'Sem acertar a pose de fármacos conhecidos, os scores de compostos novos não significam nada.', link: 'cx', status: 'em andamento' },
  { title: 'Montar um conjunto balanceado de ativos, inativos e decoys', why: 'Hoje os 16 compostos foram escolhidos pelo pIC50, sem controle negativo. Assim não dá para medir se o docking separa ativos de inativos.', status: 'pendente' },
  { title: 'Medir o desempenho: curva ROC, AUC e EF1%', why: 'Compara o ranking do docking com um controle simples, como o peso molecular. Se o controle empatar, o docking não agrega.', status: 'pendente' },
  { title: 'Corrigir a coleta do ChEMBL', why: 'A paginação atual pega só os primeiros 500 registros, sem ordenação, e mistura EGFR selvagem e mutante.', status: 'pendente' },
  { title: 'Melhorar o docking, se a validação pedir', why: 'Rever a preparação do receptor, a protonação, as águas conservadas; testar outro programa ou receptor flexível.', status: 'pendente' },
  { title: 'Fechar o projeto', why: 'Atualizar o README, remover os arquivos Zone.Identifier, adicionar licença e escrever o relatório com números verificados.', status: 'pendente' },
]

export default function Roadmap({ go }: { go: (t: TabId) => void }) {
  return (
    <section>
      <p className="lead">O que falta fazer, em ordem. As primeiras etapas decidem se o restante tem valor científico.</p>
      <Box title="Roteiro">
        <ul className="road">
          {ROAD.map((r, i) => (
            <li key={r.title}>
              <span className="n">{i + 1}</span>
              <span><b>{r.title}</b>{r.link && <> <a href={`#${r.link}`} onClick={e => { e.preventDefault(); go(r.link!) }}>ver</a></>}</span>
              <span className={`tag ${r.status === 'pendente' ? 'no' : 'run'}`}>{r.status}</span>
              <span className="why">{r.why}</span>
            </li>
          ))}
        </ul>
      </Box>
    </section>
  )
}
