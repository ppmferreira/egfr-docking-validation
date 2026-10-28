import { cn } from '../ui/cn'

export const Toast = ({ message }: { message: string }) => (
  <div role="status" className={cn(
    'pointer-events-none fixed right-4 bottom-4 z-10 max-w-[min(420px,calc(100vw-32px))] translate-y-2 rounded-md bg-ink px-3.5 py-2 font-mono text-xs text-paper opacity-0 transition duration-300',
    message && 'translate-y-0 opacity-100',
  )}>{message && `Atualizado: ${message}`}</div>
)
