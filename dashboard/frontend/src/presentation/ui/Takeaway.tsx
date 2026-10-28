import type { ReactNode } from 'react'

/** The one-sentence conclusion that closes a section. */
export const Takeaway = ({ children }: { children: ReactNode }) => (
  <p className="m-0 max-w-[78ch] border-l-[3px] border-docked pl-3 [&_b]:font-semibold">{children}</p>
)
