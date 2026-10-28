import { useCallback, useEffect, useRef, useState } from 'react'
import { api, type Dashboard, type Job } from '../api'

/** Loads /api/data and reloads it whenever the backend reports newer result files. */
export function useDashboard() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [clock, setClock] = useState('')
  const [offline, setOffline] = useState(false)
  const [notice, setNotice] = useState('')
  const stamp = useRef<number | null>(null)

  const load = useCallback(async () => {
    setData(await api.data())
  }, [])

  useEffect(() => {
    load().catch(() => setOffline(true))
    const poll = async () => {
      try {
        const v = await api.version()
        setJobs(v.jobs)
        if (stamp.current !== null && v.stamp !== stamp.current) {
          await load()
          setNotice('Novos resultados')
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
  }, [load])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(t)
  }, [notice])

  return { data, jobs, clock, offline, notice }
}
