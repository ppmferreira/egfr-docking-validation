import type { ReactNode } from 'react'
import { Progress } from './Progress'

/** A key number with a label and a caption; optional progress bar. */
export function Stat({ icon, label, value, caption, progress }: { icon?: ReactNode; label: string; value: ReactNode; caption?: ReactNode; progress?: number }) {
  return (
    <div className="grid content-start gap-0.5 rounded-lg border border-line bg-panel p-4">
      <div className="flex items-center gap-2 text-[13px] text-muted [&_svg]:size-4">{icon}<span>{label}</span></div>
      <div className="font-mono text-[28px] leading-tight font-medium tracking-[-0.03em]">{value}</div>
      {progress !== undefined && <Progress value={progress * 100} className="my-1" label={label} />}
      {caption && <div className="text-[13px] text-muted">{caption}</div>}
    </div>
  )
}
