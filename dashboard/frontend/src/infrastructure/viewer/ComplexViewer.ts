import * as $3Dmol from '3dmol'
import type { CameraTarget, Palette, Scene, StructureRenderer } from '../../domain/rendering'

const POCKET_RADIUS = 4.5   // residues within this distance (Å) of the crystal ligand are drawn as sticks

/** Adapter over 3Dmol.js: the rest of the app never touches the library directly. */
export class ComplexViewer implements StructureRenderer {
  private viewer: ReturnType<typeof $3Dmol.createViewer>
  private ids = { prot: 0, cry: 0, dd: null as number | null, vina: null as number | null }
  private framedFor: string | null = null
  private observer: ResizeObserver
  private host: HTMLElement
  private palette: Palette

  constructor(host: HTMLElement, palette: Palette) {
    this.host = host
    this.palette = palette
    this.viewer = $3Dmol.createViewer(host, { backgroundColor: palette.background })
    this.observer = new ResizeObserver(() => { this.viewer.resize(); this.viewer.render() })
    this.observer.observe(host)
  }

  render(scene: Scene): void {
    const { detail, layers, ddRank, vinaSeed, vinaPose, trajectory, frame } = scene, v = this.viewer, c = this.palette
    v.removeAllModels(); v.removeAllLabels()
    const prot = v.addModel(detail.protein, 'pdb')
    const cry = v.addModel(detail.crystal, 'sdf')
    this.ids = { prot: prot.getID(), cry: cry.getID(), dd: null, vina: null }
    const cartoon = { color: c.protein, opacity: 0.5 }
    prot.setStyle({}, { cartoon })
    if (layers.res) {
      prot.setStyle({ resi: this.pocketResidues(prot, cry) }, { cartoon, stick: { radius: 0.1, colorscheme: 'greyCarbon' } })
    }
    cry.setStyle({}, layers.cry ? { stick: { radius: 0.2, color: c.cry } } : {})
    if (trajectory) {
      const m = v.addModelsAsFrames(trajectory, 'pdb')
      m.setStyle({}, { stick: { radius: 0.22, color: c.dd } })
      this.ids.dd = m.getID(); v.setFrame(frame)
    } else if (layers.dd) {
      const p = detail.diffdock.find(x => x.rank === ddRank)
      if (p) { const m = v.addModel(p.mol, 'sdf'); m.setStyle({}, { stick: { radius: 0.2, color: c.dd } }); this.ids.dd = m.getID() }
    }
    if (layers.vina) {
      const p = detail.vina.find(x => x.seed === vinaSeed && x.pose === vinaPose)
      if (p) { const m = v.addModel(p.mol, 'sdf'); m.setStyle({}, { stick: { radius: 0.2, color: c.vina } }); this.ids.vina = m.getID() }
    }
    this.enableHoverLabels(ddRank, vinaSeed, vinaPose)
    if (this.framedFor !== detail.pdb) {
      this.framedFor = detail.pdb
      v.resize(); this.camera('pocket')
      // The canvas only reaches its final size after layout; frame again once it has.
      requestAnimationFrame(() => { this.viewer.resize(); this.camera('pocket') })
    } else v.render()
  }

  setFrame(i: number): void { this.viewer.setFrame(i); this.viewer.render() }

  camera(target: CameraTarget): void {
    const v = this.viewer
    if (target === 'all') { v.zoomTo({ model: [this.ids.prot] }); v.zoom(1.1) }
    else { v.zoomTo({ model: [this.ids.cry] }); v.zoom(0.62) }
    v.render()
  }

  snapshot(): string { return this.viewer.pngURI() }

  dispose(): void {
    this.observer.disconnect()
    this.host.innerHTML = ''
  }

  private pocketResidues(prot: $3Dmol.GLModel, cry: $3Dmol.GLModel): number[] {
    const lig = cry.selectedAtoms({}), near = new Set<number>()
    prot.selectedAtoms({}).forEach(a => {
      if (a.resi !== undefined && !near.has(a.resi) && lig.some(l => Math.hypot(l.x! - a.x!, l.y! - a.y!, l.z! - a.z!) <= POCKET_RADIUS)) near.add(a.resi)
    })
    return [...near]
  }

  private enableHoverLabels(ddRank: number, vinaSeed: number, vinaPose: number): void {
    const v = this.viewer
    let label: ReturnType<typeof v.addLabel> | null = null
    v.setHoverable({}, true, (a: $3Dmol.AtomSpec) => {
      if (label) v.removeLabel(label)
      const id = a.model
      const text = id === this.ids.cry ? 'Cristal (real)' : id === this.ids.dd ? `DiffDock · posição ${ddRank}`
        : id === this.ids.vina ? `Vina · seed ${vinaSeed}, pose ${vinaPose}` : `${a.resn} ${a.resi}`
      label = v.addLabel(text, { position: a as { x: number; y: number; z: number }, fontSize: 12, fontColor: '#e6edf0',
        backgroundColor: '#0a1116', backgroundOpacity: 0.85, borderColor: '#46586a', borderThickness: 1, inFront: true })
      v.render()
    }, () => { if (label) { v.removeLabel(label); label = null; v.render() } })
  }
}
