import { useCallback, useEffect, useState } from 'react'
import { centroid, distance, parseFrames, type Frame } from '../domain/trajectory'
import { useGateway } from './servicesContext'

const STEP_MS = 350

/** Plays DiffDock's reverse-diffusion trajectory for one pose: frame index, play/pause and distance to the crystal. */
export function useTrajectoryPlayer(pdb: string | null, rank: number, available: boolean, crystalCenter: number[] | undefined) {
  const gateway = useGateway()
  const [traj, setTraj] = useState<{ rank: number; text: string; frames: Frame[] } | null>(null)
  const [active, setActive] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [frame, setFrame] = useState(0)
  const [missing, setMissing] = useState(false)

  const stop = useCallback(() => { setPlaying(false); setActive(false); setMissing(false) }, [])
  const reset = useCallback(() => { stop(); setTraj(null); setFrame(0) }, [stop])

  const toggle = async () => {
    if (!available || !pdb) return
    if (playing) return setPlaying(false)
    let t = traj
    if (!t || t.rank !== rank) {
      const j = await gateway.trajectory(pdb, rank)
      if (!j.frames) { setMissing(true); return }
      t = { rank, text: j.frames, frames: parseFrames(j.frames) }
      setTraj(t)
    }
    setMissing(false); setActive(true)
    setFrame(f => (f >= t!.frames.length - 1 ? 0 : f))
    setPlaying(true)
  }

  const seek = (i: number) => { setPlaying(false); setFrame(i) }

  useEffect(() => {
    if (!playing || !traj) return
    const id = setInterval(() => setFrame(f => {
      if (f + 1 >= traj.frames.length) { setPlaying(false); return f }
      return f + 1
    }), STEP_MS)
    return () => clearInterval(id)
  }, [playing, traj])

  const showing = active && traj
  const distanceToCrystal = showing && crystalCenter ? distance(centroid(traj.frames[Math.min(frame, traj.frames.length - 1)]), crystalCenter) : null
  return {
    /** PDB text to draw instead of the static pose, or null when the animation is off. */
    text: showing ? traj.text : null,
    total: showing ? traj.frames.length : 0,
    frame, playing, missing, distanceToCrystal, toggle, seek, stop, reset,
  }
}
