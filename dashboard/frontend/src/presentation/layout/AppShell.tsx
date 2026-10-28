import type { ReactNode } from 'react'

/** Sidebar on the left, the current page on the right. */
export const AppShell = ({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) => (
  <div className="mx-auto grid max-w-[1380px] grid-cols-[216px_minmax(0,1fr)] gap-8 px-4 max-[860px]:grid-cols-[minmax(0,1fr)] max-[860px]:gap-0">
    {sidebar}
    <main className="grid min-w-0 content-start gap-[18px] pt-5 pb-12">{children}</main>
  </div>
)
