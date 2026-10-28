import { useEffect, useRef, useState } from 'react'
import { api, type Live as LiveData } from '../api'
import { Answer, Box } from '../components/Answer'
import { ago, dur } from '../lib/format'

function Meter({ label, val, max, unit }: { label: string; val: number; max: number; unit: string }) {
  return (
    <div className="meter">
      <div className="l"><span>{label}</span><span>{val}{unit}</span></div>
      <div className="t"><i style={{ width: `${Math.min(100, 100 * val / max)}%` }} /></div>
    </div>
  )
}

function Console({ file, age, tail }: { file: string; age: number; tail: string[] }) {
  const ref = useRef<HTMLPreElement>(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight })
  return <Box title={`${file} · atualizado ${ago(age)}`}><pre className="con" ref={ref}>{tail.join('\n')}</pre></Box>
}

export default function Live() {
  const [live, setLive] = useState<LiveData | null>(null)
  useEffect(() => {
    let alive = true
    const tick = () => api.live().then(l => { if (alive) setLive(l) }).catch(() => undefined)
    tick()
    const id = setInterval(tick, 2000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  if (!live) return <section><Answer kind="no" chip="Carregando">Lendo o estado da máquina…</Answer></section>
  const g = live.gpu
  return (
    <section>
      <Answer kind={live.jobs.length ? 'warn' : 'ok'} chip={live.jobs.length ? 'Rodando' : 'Parado'}>
        {live.jobs.length ? <>Há <b>{live.jobs.length}</b> análise(s) em andamento. Esta tela atualiza a cada 2 segundos.</>
          : 'Nenhuma análise rodando agora. Quando você iniciar uma, ela aparece aqui.'}
      </Answer>
      <div className="grid">
        <Box title="Placa de vídeo (GPU)"><div className="pad">
          {g ? <><div className="note" style={{ marginBottom: 10 }}>{g.name}</div>
            <Meter label="uso da GPU" val={g.util} max={100} unit="%" />
            <Meter label="memória da GPU" val={g.mem_used} max={g.mem_total} unit=" MiB" />
            <Meter label="temperatura" val={g.temp} max={100} unit=" °C" /></>
            : <span className="note">GPU não disponível neste ambiente.</span>}
        </div></Box>
        <Box title="Em execução">
          <ul className="steps">
            {live.jobs.map(j => <li key={j.name}><span className="pulse" /><span>{j.name}</span><span className="tag run">{dur(j.seconds)}</span></li>)}
            {!live.jobs.length && <li><span className="note">Nada em execução.</span></li>}
          </ul>
        </Box>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {live.logs.map(l => <Console key={l.file} {...l} />)}
        {!live.logs.length && <div className="box pad note">Nenhum log recente.</div>}
      </div>
    </section>
  )
}
