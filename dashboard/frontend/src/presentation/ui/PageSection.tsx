import type { ReactNode } from 'react'

/** A titled block inside a long page. `id` makes it a target for the table of contents. */
export function PageSection({ id, title, intro, children }: { id?: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="grid scroll-mt-[calc(var(--barh,72px)+16px)] gap-3">
      <div>
        <h2 className="m-0 text-xl font-semibold tracking-tight">{title}</h2>
        {intro && <p className="mt-1 mb-0 max-w-[74ch] text-muted">{intro}</p>}
      </div>
      {children}
    </section>
  )
}
