import { useEffect, useRef, useState } from 'react'
import type { Dashboard, Job } from '../domain/entities'
import { useGateway } from './servicesContext'

/** Loads the project data and reloads it whenever the backend reports newer result files. */
export function useDashboard() {
  const gateway = useGateway()
  const [data, setData] = useState<Dashboard | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [clock, setClock] = useState('')
  const [offline, setOffline] = useState(false)
  const [notice, setNotice] = useState('')
  const stamp = useRef<number | null>(null)

  useEffect(() => {
    const poll = async () => {
      try {
        const v = await gateway.version()
        setJobs(v.jobs)
        // First pass loads the data; later passes reload it only when result files changed.
        if (stamp.current === null || v.stamp !== stamp.current) {
          setData(await gateway.data())
          if (stamp.current !== null) setNotice('novos resultados')
        }
        stamp.current = v.stamp
        setClock(new Date().toLocaleTimeString('pt-BR'))
        setOffline(false)
      } catch {
        setOffline(true)
      }
    }
    poll()
    const id = setInterval(poll, 2500)
    return () => clearInterval(id)
  }, [gateway])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(t)
  }, [notice])

  return { data, jobs, clock, offline, notice }
}
