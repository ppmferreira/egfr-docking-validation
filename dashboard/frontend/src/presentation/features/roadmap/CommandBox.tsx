import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

/** A shell command with a copy button. */
export function CommandBox({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* clipboard blocked: the text is still selectable */ }
  }
  return (
    <div className="flex items-center gap-2 rounded-md bg-docked/8 py-0.5 pr-1 pl-3">
      <code className="flex-1 overflow-x-auto py-1.5 font-mono text-[12.5px] whitespace-nowrap">{command}</code>
      <button type="button" onClick={copy} aria-label={copied ? 'Comando copiado' : 'Copiar comando'} title={copied ? 'Copiado' : 'Copiar comando'}
        className="grid size-8 cursor-pointer place-items-center rounded-md bg-transparent text-muted hover:bg-docked/10 hover:text-ink">
        {copied ? <Check className="size-4 text-pass" /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}
