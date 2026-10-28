import type { TabId } from '../../../application/routes'

/** Which screen shows the result of a pipeline stage. */
export function stepTarget(id: string): TabId | null {
  if (id === '02') return 'chem'
  if (id === '04') return 'dock'
  if (['04b', '04c', '04d'].includes(id)) return 'valid'
  if (['06', '07', '08'].includes(id)) return 'cx'
  if (['10', '11', '12', '13'].includes(id)) return 'next'
  return null
}
