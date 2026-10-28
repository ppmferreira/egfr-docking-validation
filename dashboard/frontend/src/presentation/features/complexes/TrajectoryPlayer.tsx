interface Props {
  playing: boolean
  total: number
  frame: number
  label: string
  onToggle: () => void
  onSeek: (i: number) => void
}

/** Plays DiffDock's reverse-diffusion trajectory: the ligand moves from a random pose to its final one. */
export function TrajectoryPlayer({ playing, total, frame, label, onToggle, onSeek }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2.5 max-[1180px]:flex-wrap">
      <button type="button" onClick={onToggle}
        className="min-w-28 cursor-pointer rounded-md border border-line bg-paper px-3.5 py-1.5 text-[13px] font-medium text-ink hover:border-docked">{playing ? 'Pausar' : 'Ver o encaixe'}</button>
      <input type="range" min={0} max={Math.max(total - 1, 0)} value={frame} disabled={!total} aria-label="Passo da difusão"
        onChange={e => onSeek(+e.target.value)} className="min-w-[120px] flex-1 accent-docked" />
      <span className="min-w-[190px] text-right font-mono text-xs text-muted max-[1180px]:text-left">{label}</span>
    </div>
  )
}
