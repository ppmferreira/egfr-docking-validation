import type { ReactNode } from 'react'
import type { TabId } from '../../application/routes'
import { TAB_GROUPS, TAB_TITLES } from '../navigation'
import styles from './Sidebar.module.css'

interface Props { current: TabId; onGo: (t: TabId) => void; badge: (id: TabId) => ReactNode }

export function Sidebar({ current, onGo, badge }: Props) {
  return (
    <nav className={styles.nav} role="tablist" aria-label="Seções do painel">
      {TAB_GROUPS.map(([name, ids]) => (
        <div className={styles.group} key={name}>
          <div className={styles.groupTitle}>{name}</div>
          {ids.map(id => (
            <button key={id} type="button" role="tab" className={styles.item} aria-selected={current === id} onClick={() => onGo(id)}>
              <span>{TAB_TITLES[id]}</span><i className={styles.badge}>{badge(id)}</i>
            </button>
          ))}
        </div>
      ))}
    </nav>
  )
}
