import type { ComplexDetail } from './entities'
import type { Layers } from './layers'

export interface Palette { cry: string; dd: string; vina: string; protein: string; background: string }

/** Everything needed to draw one complex: which poses, which layers, and (optionally) a trajectory to play. */
export interface Scene {
  detail: ComplexDetail
  layers: Layers
  ddRank: number
  vinaSeed: number
  vinaPose: number
  /** PDB text of DiffDock's trajectory; when set it replaces the static DiffDock pose. */
  trajectory: string | null
  frame: number
}

export type CameraTarget = 'pocket' | 'all'

/** Port: draws a complex in a host element. Implemented by the infrastructure layer on top of a 3D library. */
export interface StructureRenderer {
  render(scene: Scene): void
  setFrame(i: number): void
  camera(target: CameraTarget): void
  /** PNG data URL of what is on screen. */
  snapshot(): string
  dispose(): void
}

export type StructureRendererFactory = (host: HTMLElement, palette: Palette) => StructureRenderer
