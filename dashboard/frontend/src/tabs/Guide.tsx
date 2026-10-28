import type { Dashboard } from '../api'
import { Answer, Box } from '../components/Answer'
import { f2 } from '../lib/format'
import { verdict } from '../lib/summary'
import type { TabId } from '../nav'

export default function Guide({ data, go }: { data: Dashboard; go: (t: TabId) => void }) {
  const v = verdict(data), top = data.redocking?.poses[0]
  const ms = v.ms.map(x => `${x.ligand} ${f2(x.mean)} Å`).join(', ')
  const story: [string, string][] = [
    ['Reunimos os dados', 'Baixamos a estrutura 3D da proteína EGFR e 236 moléculas já testadas em laboratório.'],
    ['Pedimos notas ao programa', 'Escolhemos 16 moléculas e o programa (AutoDock Vina) deu uma nota de encaixe a cada uma.'],
    ['Desconfiamos das notas', 'Fizemos um teste: tirar o erlotinibe da proteína e pedir ao programa para recolocá-lo. A resposta certa já é conhecida, vem do cristal.'],
    ['O programa errou', top ? `A primeira tentativa dele ficou a ${f2(top.rmsd)} Å da posição real. Acertar significa ficar a até 2 Å.` : 'Ainda sem resultado.'],
    ['Tentamos melhorar e testar em outros remédios', v.ms.length ? `Mudamos configurações e testamos outros fármacos. Resultado: ${ms}. Chegou perto, mas ainda fora do limite.` : 'Em andamento.'],
  ]
  const links: [TabId, string, string][] = [
    ['cx', 'Complexos', 'ver cada complexo em 3D, com o cristal, o DiffDock e o Vina juntos.'],
    ['valid', 'Validação', 'o teste que decide se o programa é confiável.'],
    ['dock', 'Docking dos 16', 'as notas dos 16 compostos (ainda não confiáveis).'],
    ['next', 'Próximos passos', 'o que falta fazer.'],
  ]
  return (
    <section>
      <Answer kind={v.okAll ? 'ok' : 'warn'} chip="Onde estamos">
        {v.okAll ? 'O teste de confiança passou. Os próximos passos já podem usar os scores.'
          : <>Estamos na fase de <b>testar se o programa é confiável</b>. Ainda não é, e por isso não tiramos conclusões sobre os 16 compostos.</>}
      </Answer>
      <Box title="O projeto em uma frase"><div className="pad guide">
        <p>Estamos testando se um programa de computador consegue <b>prever como um remédio se encaixa numa proteína ligada ao câncer</b> (a EGFR). Antes de usar o programa para valer, precisamos provar que ele acerta casos que já conhecemos.</p>
      </div></Box>
      <Box title="O que já aconteceu, em 5 passos">
        <ol className="story">{story.map(([t, s]) => <li key={t}><b>{t}</b><span>{s}</span></li>)}</ol>
      </Box>
      <Box title="O que isso significa"><div className="pad guide">
        <p><b>Não é fracasso.</b> Descobrir que um método ainda não é confiável, antes de publicar números bonitos e errados, é o trabalho certo. Um resultado negativo bem documentado vale muito em portfólio científico.</p>
        <p><b>Você não precisa decidir nada agora.</b> O próximo passo é continuar validando.</p>
      </div></Box>
      <Box title="Como usar este painel">
        <ul className="steps">
          {links.map(([id, name, what]) => (
            <li key={id}><span><b>{name}</b>: {what}</span><a href={`#${id}`} onClick={e => { e.preventDefault(); go(id) }}>abrir</a></li>
          ))}
        </ul>
      </Box>
    </section>
  )
}
