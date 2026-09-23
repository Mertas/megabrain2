import { useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { navSections, type Role } from '../../../lib/routes'
import { notifyUrlChange } from '../../../lib/navigation'
import styles from './Sidebar.module.scss'

export interface SidebarProps {
  activeNav: string
  isOpen?: boolean
  onClose?: () => void
  isLoggedIn?: boolean
  isAdmin?: boolean
}

export function Sidebar({ activeNav, isOpen, onClose, isLoggedIn = false, isAdmin = false }: SidebarProps) {
  const navigate = useNavigate()

  const role: Role = isAdmin ? 'admin' : isLoggedIn ? 'auth' : 'public'
  const sections = useMemo(() => navSections(role), [role])

  const handleClick = useCallback((path: string) => {
    navigate({ to: path as any })
    notifyUrlChange()
    onClose?.()
  }, [navigate, onClose])

  return (
    <div className={`l-aside${isOpen ? ' is-open' : ''}`}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть меню">
        &times;
      </button>
      <nav className="b-nav" aria-label="Основное меню">
        {sections.map((section) => (
          <div key={section.group} className={styles.group}>
            <div className={styles.groupTitle}>{section.group}</div>
            <ul className={styles.groupList}>
              {section.items.map(({ id, meta }) => (
                <li key={id} className={activeNav === id ? 'b-nav--active' : ''}>
                  <a
                    className={styles.navLink}
                    href={meta.path}
                    onClick={(e) => { e.preventDefault(); handleClick(meta.path || '/') }}
                  >
                    {meta.icon}<span>{meta.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="b-copyrights">
        <p>&copy; <a href="http://futurico.ru">futurico</a> 2011</p>
        <p>К сожалению, на данный момент уникальная система искусственного интеллекта MEGABRAIN.RU находится в стадии закрытого тестирования.</p>
      </div>
    </div>
  )
}
