import { Tooltip } from 'radix-ui'
import type { ReactNode } from 'react'

/** Tooltip (Radix). Needs one <TipProvider> above it. The trigger stays keyboard-focusable. */
export const TipProvider = ({ children }: { children: ReactNode }) => <Tooltip.Provider delayDuration={120}>{children}</Tooltip.Provider>

export function Tip({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={6} className="z-50 max-w-72 rounded-md border border-line bg-ink px-2.5 py-1.5 text-xs text-paper shadow-lg">
          {label}
          <Tooltip.Arrow className="fill-ink" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
