import { useEffect, useState } from 'react'
import type { ComplexDetail } from '../domain/entities'
import { useGateway } from './servicesContext'

/** Fetches one complex. `refreshKey` forces a re-read, e.g. when a blind-test run adds rows for it. */
export function useComplexDetail(pdb: string | null, refreshKey: number) {
  const gateway = useGateway()
  const [detail, setDetail] = useState<ComplexDetail | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!pdb) return
    let alive = true
    gateway.complex(pdb)
      .then(d => { if (alive) { setDetail(d); setFailed(false) } })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [gateway, pdb, refreshKey])
  // A previous complex's data is not shown while the next one loads.
  return { detail: detail && detail.pdb === pdb ? detail : null, failed }
}
