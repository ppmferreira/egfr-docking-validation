import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type ComplexDetail, type Dashboard } from '../../api'
import { Answer } from '../../components/Answer'
import { cls, f2 } from '../../lib/format'
import { complexEntries, type Entry } from '../../lib/summary'
import { ComplexList } from './ComplexList'
import { Player } from './Player'
import { PoseChips } from './PoseChips'
import type { Layers } from './layers'
import { StructureViewer } from './StructureViewer'

const HINT = 'arraste para girar · role para zoom · passe o mouse para ver nomes'
const centroid = (pts: number[][]) => pts.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map(x => x / pts.length)

/** Atom coordinates of every model in a PDB trajectory (columns 31-54 of ATOM/HETATM lines). */
function parseFrames(text: string): number[][][] {
  return text.split(/^ENDMDL.*$/m)
    .map(block => block.split('\n').filter(l => /^(ATOM|HETATM)/.test(l))
      .map(l => [parseFloat(l.slice(30, 38)), parseFloat(l.slice(38, 46)), parseFloat(l.slice(46, 54))]))
    .filter(f => f.length)
}

function Banner({ entries, running }: { entries: Entry[]; running: boolean }) {
  const train = entries.filter(e => e.group === 'train')
  const blind = entries.filter(e => e.group === 'blind')
  const done = blind.filter(e => !e.pending && !e.skipped)
  const ddOk = (a: Entry[]) => a.filter(e => e.dd !== null && e.dd <= 2).length
  const vOk = (a: Entry[]) => a.filter(e => e.vpass !== null && e.vpass >= 2).length
  if (!train.length && !done.length) return <Answer kind="no" chip="Sem resultado">Rode scripts/06_diffdock.py e scripts/04d_redock_multi.py.</Answer>
  return (
    <Answer kind={running ? 'warn' : 'ok'} chip={done.length ? `${done.length} de ${blind.length} cegos` : `${train.length} complexos`}>
      <b>Complexos de treino:</b> DiffDock acertou {ddOk(train)} de {train.length}, Vina {vOk(train)} de {train.length}.{' '}
      {done.length > 0 && <><b>Complexos novos (cegos):</b> DiffDock {ddOk(done)} de {done.length}, Vina {vOk(done)} de {done.length}{running ? ', ainda rodando' : ''}. </>}
      Acertar é ficar a até 2 Å do cristal. O Vina recebe a posição do bolsão; o DiffDock procura na proteína inteira.
    </Answer>
  )
}

function Header({ entry }: { entry: Entry }) {
  const kind = entry.group === 'train'
    ? 'Estrutura antiga, provavelmente nos dados de treino do DiffDock.'
    : `Publicada depois do treino do DiffDock${entry.res ? ` · ${entry.res} Å de resolução` : ''}.`
  return (
    <div className="cxhd">
      <div><h2>{entry.pdb}<span>{entry.lig}</span></h2><div className="sub">{kind}</div></div>
      <div className="tiles">
        <div className="tile">
          <small>DiffDock · pose 1</small>
          <strong className={entry.dd === null ? '' : cls(entry.dd)}>{entry.dd === null ? '–' : `${f2(entry.dd)} Å`}</strong>
          <span>{entry.dd === null ? 'sem resultado' : entry.dd <= 2 ? 'acertou' : 'errou'}</span>
        </div>
        <div className="tile">
          <small>Vina · média de {entry.vn ?? 3} seeds</small>
          <strong className={entry.vina === null ? '' : cls(entry.vina)}>{entry.vina === null ? '–' : `${f2(entry.vina)} Å`}</strong>
          <span>{entry.vn ? `${entry.vpass} de ${entry.vn} seeds ≤ 2 Å` : 'sem resultado'}</span>
        </div>
      </div>
    </div>
  )
}

export default function ComplexesTab({ data, running }: { data: Dashboard; running: boolean }) {
  const entries = useMemo(() => complexEntries(data), [data])
  const [picked, setPicked] = useState<string | null>(null)
  const current = picked ?? entries.find(e => !e.pending && !e.skipped)?.pdb ?? null
  const entry = entries.find(e => e.pdb === current) ?? null

  const [detail, setDetail] = useState<ComplexDetail | null>(null)
  const [failed, setFailed] = useState(false)
  const [ddRank, setDDRank] = useState(1)
  const [vPose, setVPose] = useState(1)
  const [layers, setLayers] = useState<Layers>({ cry: true, dd: true, vina: false, res: true })
  const [traj, setTraj] = useState<{ rank: number; text: string; frames: number[][][] } | null>(null)
  const [anim, setAnim] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [frame, setFrame] = useState(0)
  const [note, setNote] = useState('')

  // Re-read the structure when a blind-test run adds rows for it.
  const rowsKey = data.blind.rows.filter(r => r.pdb === current).length

  useEffect(() => {
    if (!current) return
    let alive = true
    api.complex(current).then(d => { if (alive) { setDetail(d); setFailed(false) } }).catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [current, rowsKey])

  const stop = useCallback(() => { setPlaying(false); setAnim(false); setNote('') }, [])

  const pick = (pdb: string) => {
    if (pdb === current) return
    stop(); setTraj(null); setFrame(0); setPicked(pdb); setDDRank(1); setVPose(1); setFailed(false)
  }

  const ready = detail && detail.pdb === current ? detail : null
  const rank = ready?.diffdock.some(p => p.rank === ddRank) ? ddRank : ready?.diffdock[0]?.rank ?? 1

  const chooseDD = (r: number) => { stop(); setDDRank(r); setLayers(l => ({ ...l, dd: true })) }
  const chooseVina = (p: number) => { setVPose(p); setLayers(l => ({ ...l, vina: true })) }
  const toggleLayer = (k: keyof Layers) => { if (k === 'dd') stop(); setLayers(l => ({ ...l, [k]: !l[k] })) }

  const togglePlay = async () => {
    if (!ready?.has_traj || !current) return
    if (playing) return setPlaying(false)
    let t = traj
    if (!t || t.rank !== rank) {
      const j = await api.trajectory(current, rank)
      if (!j.frames) { setNote('Sem trajetória salva para esta posição.'); return }
      t = { rank, text: j.frames, frames: parseFrames(j.frames) }
      setTraj(t)
    }
    setNote(''); setAnim(true)
    setFrame(f => (f >= t!.frames.length - 1 ? 0 : f))
    setPlaying(true)
  }

  useEffect(() => {
    if (!playing || !traj) return
    const id = setInterval(() => setFrame(f => {
      if (f + 1 >= traj.frames.length) { setPlaying(false); return f }
      return f + 1
    }), 350)
    return () => clearInterval(id)
  }, [playing, traj])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!ready || !ready.diffdock.length || /^(INPUT|SELECT|TEXTAREA)$/.test((e.target as HTMLElement).tagName)) return
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      e.preventDefault()
      const i = ready.diffdock.findIndex(p => p.rank === rank), n = ready.diffdock.length
      chooseDD(ready.diffdock[(i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n].rank)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  let label = note
  if (anim && traj && ready) {
    const c = centroid(traj.frames[Math.min(frame, traj.frames.length - 1)])
    const d = Math.hypot(c[0] - ready.center[0], c[1] - ready.center[1], c[2] - ready.center[2])
    label = `passo ${frame + 1} de ${traj.frames.length} · a ${d.toFixed(1)} Å do cristal`
  }

  return (
    <section>
      <Banner entries={entries} running={running} />
      <div className="cxwork">
        <ComplexList entries={entries} current={current} onPick={pick} />
        <div className="cxmain">
          {entry && <Header entry={entry} />}
          {failed && <div className="box pad note">Não foi possível montar este complexo (a estrutura do ligante não pôde ser reconstruída).</div>}
          {ready && (
            <>
              <StructureViewer detail={ready} layers={layers} ddRank={rank} vPose={vPose} frame={frame}
                trajectory={anim && traj ? traj.text : null}
                hint={anim ? 'o ligante em ciano parte de uma posição aleatória até o encaixe' : HINT} onLayer={toggleLayer} />
              <PoseChips detail={ready} ddRank={rank} vPose={vPose} onDD={chooseDD} onVina={chooseVina} />
              {ready.has_traj && (
                <Player playing={playing} total={anim && traj ? traj.frames.length : 0} frame={frame} label={label}
                  onToggle={togglePlay} onSeek={i => { setPlaying(false); setFrame(i) }} />
              )}
            </>
          )}
          {!ready && !failed && current && <div className="box pad note">Carregando {current}…</div>}
        </div>
      </div>
      <details className="box cxhow">
        <summary>Como cada método foi rodado</summary>
        <div>
          <p><b>Vina:</b> caixa de 20 Å centrada no ligante do cristal, exhaustiveness 32, 3 seeds. Os números da lista são a média do RMSD da pose 1 nas 3 execuções; o desenho usa a seed 1.</p>
          <p><b>DiffDock:</b> docking às cegas (sem informar o bolsão), 10 amostras, configuração padrão. Vale a pose de maior confiança.</p>
          <p><b>RMSD:</b> distância média entre os átomos pesados da pose prevista e os do ligante no cristal, sem realinhar. Até 2 Å conta como acerto.</p>
          <p><b>Cegos:</b> estruturas de EGFR por raios X publicadas desde 2022, com ligante de 18 a 70 átomos pesados ligado ao hinge e sem ligação covalente. Os critérios foram fixados antes de rodar (scripts/07_blind_select.py).</p>
        </div>
      </details>
    </section>
  )
}
