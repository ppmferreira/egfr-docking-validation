import { useEffect, useState } from 'react'
import type { Live } from '../domain/entities'
import { useGateway } from './servicesContext'

/** Polls jobs, GPU and log tails every 2 s while the component using it is mounted. */
export function useLiveStatus(): Live | null {
  const gateway = useGateway()
  const [live, setLive] = useState<Live | null>(null)
  useEffect(() => {
    let alive = true
    const tick = () => gateway.live().then(l => { if (alive) setLive(l) }).catch(() => undefined)
    tick()
    const id = setInterval(tick, 2000)
    return () => { alive = false; clearInterval(id) }
  }, [gateway])
  return live
}
