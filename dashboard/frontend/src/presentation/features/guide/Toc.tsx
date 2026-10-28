import { useScrollSpy } from '../../hooks/useScrollSpy'
import { cn } from '../../ui/cn'

const SECTIONS: [string, string][] = [
  ['resumo-rapido', 'Em resumo'], ['pergunta', 'A pergunta'], ['jornada', 'O que foi feito'], ['rmsd', 'Medir o encaixe'],
  ['metodos', 'Os métodos'], ['achados', 'O que encontramos'], ['tela', 'Usar a tela Complexos'], ['faq', 'Perguntas'], ['mapa', 'Mapa do painel'],
]
const IDS = SECTIONS.map(s => s[0])

/** "Nesta página": jumps to a section and highlights the one being read. */
export function Toc() {
  const active = useScrollSpy(IDS)
  return (
    <nav aria-label="Nesta página" className="sticky top-[calc(var(--barh,72px)+20px)] hidden self-start lg:block">
      <div className="px-3 pb-1 font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase">Nesta página</div>
      <ul className="m-0 grid list-none gap-px p-0">
        {SECTIONS.map(([id, label]) => (
          <li key={id}>
            <button type="button" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className={cn('w-full cursor-pointer rounded-r border-l-2 border-transparent bg-transparent px-3 py-1.5 text-left text-[13px] text-muted hover:text-ink', active === id && 'border-docked bg-docked/10 text-ink')}>
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
