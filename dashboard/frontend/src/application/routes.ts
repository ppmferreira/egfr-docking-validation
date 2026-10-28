import { useEffect, useState } from 'react'

export type TabId = 'cx' | 'valid' | 'dock' | 'enrich' | 'chem' | 'guia' | 'resumo' | 'next' | 'live'

const TAB_IDS: readonly TabId[] = ['cx', 'valid', 'dock', 'enrich', 'chem', 'guia', 'resumo', 'next', 'live']
export const isTabId = (s: string): s is TabId => (TAB_IDS as readonly string[]).includes(s)

/** The current tab lives in the URL hash, so a tab can be linked to and survives a reload. */
export function useHashTab(): [TabId, (t: TabId) => void] {
  const read = (): TabId => { const h = location.hash.slice(1); return isTabId(h) ? h : 'cx' }
  const [tab, setTab] = useState<TabId>(read)
  useEffect(() => {
    const on = () => setTab(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (t: TabId) => { location.hash = t; window.scrollTo(0, 0) }
  return [tab, go]
}
