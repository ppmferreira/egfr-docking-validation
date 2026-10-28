import type { TabId } from '../application/routes'

export const TAB_TITLES: Record<TabId, string> = {
  cx: 'Complexos', valid: 'Validação', dock: 'Docking dos 16', enrich: 'Enriquecimento', chem: 'Espaço químico',
  guia: 'Comece aqui', resumo: 'Resumo', next: 'Próximos passos', live: 'Ao vivo',
}

export const TAB_GROUPS: [string, TabId[]][] = [
  ['Entender', ['guia', 'resumo', 'next']],
  ['Resultados', ['cx', 'valid', 'dock', 'enrich', 'chem']],
  ['Acompanhar', ['live']],
]
