import { Slider as S } from 'radix-ui'
import type { CSSProperties } from 'react'
import { cn } from './cn'

interface Props {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string
  /** CSS background for the rail, e.g. a gradient that marks zones. */
  railStyle?: CSSProperties
  thumbClassName?: string
}

/** Radix Slider (keyboard and screen-reader accessible) with a custom rail. */
export function Slider({ value, min, max, step, onChange, label, railStyle, thumbClassName }: Props) {
  return (
    <S.Root min={min} max={max} step={step} value={[value]} onValueChange={v => onChange(v[0])} aria-label={label}
      className="relative flex h-6 w-full touch-none items-center select-none">
      <S.Track className="relative h-2.5 grow overflow-hidden rounded-full bg-line" style={railStyle}>
        <S.Range className="absolute h-full" />
      </S.Track>
      <S.Thumb className={cn('block size-[22px] cursor-grab rounded-full border-[3px] border-docked bg-panel shadow outline-none focus-visible:ring-2 focus-visible:ring-docked/50 active:cursor-grabbing', thumbClassName)} />
    </S.Root>
  )
}
