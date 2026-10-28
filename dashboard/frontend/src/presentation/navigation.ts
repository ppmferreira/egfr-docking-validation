import type { TabId } from '../application/routes'

export const TAB_TITLES: Record<TabId, string> = {
  cx: 'Complexos', valid: 'Validação', dock: 'Docking dos 16', chem: 'Espaço químico',
  guia: 'Comece aqui', resumo: 'Resumo', next: 'Próximos passos', live: 'Ao vivo',
}

export const TAB_GROUPS: [string, TabId[]][] = [
  ['Resultados', ['cx', 'valid', 'dock', 'chem']],
  ['Entender', ['guia', 'resumo', 'next']],
  ['Acompanhar', ['live']],
]
