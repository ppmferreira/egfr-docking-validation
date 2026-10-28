import { Progress } from '../../ui/Progress'

export function Meter({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  return (
    <div className="mb-3 grid gap-1 last:mb-0">
      <div className="flex justify-between font-mono text-xs text-muted"><span>{label}</span><span>{value}{unit}</span></div>
      <Progress value={100 * value / max} label={label} className="h-2" />
    </div>
  )
}
