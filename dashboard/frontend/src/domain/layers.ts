/** Which layers of a complex are drawn: crystal ligand, DiffDock pose, Vina pose, pocket residues. */
export interface Layers { cry: boolean; dd: boolean; vina: boolean; res: boolean }
export const DEFAULT_LAYERS: Layers = { cry: true, dd: true, vina: false, res: true }
