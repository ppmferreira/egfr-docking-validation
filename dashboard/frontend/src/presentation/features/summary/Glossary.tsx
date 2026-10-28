import { Search } from 'lucide-react'
import { useState } from 'react'
import { Accordion, AccordionItem } from '../../ui/Accordion'
import { GLOSSARY } from './glossary'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Terms the panel uses, with a search box. */
export function Glossary() {
  const [q, setQ] = useState('')
  const shown = GLOSSARY.filter(t => !q || norm(t.term + ' ' + t.definition).includes(norm(q)))
  return (
    <div className="grid gap-3">
      <label className="relative block max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar um termo" aria-label="Buscar no glossário"
          className="w-full rounded-md border border-line bg-panel py-2 pr-3 pl-9 text-sm text-ink placeholder:text-muted focus:border-docked focus:outline-none" />
      </label>
      {shown.length
        ? <Accordion>{shown.map(t => <AccordionItem key={t.term} value={t.term} title={t.term}><div className="max-w-[78ch]">{t.definition}</div></AccordionItem>)}</Accordion>
        : <p className="m-0 text-muted">Nenhum termo encontrado.</p>}
    </div>
  )
}
