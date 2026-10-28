interface Props {
  playing: boolean
  total: number
  frame: number
  label: string
  onToggle: () => void
  onSeek: (i: number) => void
}

/** Plays DiffDock's reverse-diffusion trajectory: the ligand moves from a random pose to its final one. */
export function Player({ playing, total, frame, label, onToggle, onSeek }: Props) {
  return (
    <div className="player">
      <button type="button" className="play" onClick={onToggle}>{playing ? 'Pausar' : 'Ver o encaixe'}</button>
      <input type="range" min={0} max={Math.max(total - 1, 0)} value={frame} disabled={!total}
        aria-label="Passo da difusão" onChange={e => onSeek(+e.target.value)} />
      <span className="pl">{label}</span>
    </div>
  )
}
