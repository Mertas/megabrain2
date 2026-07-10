import { useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { navItems, type NavKey } from '../../../lib/navItems'
import { notifyUrlChange } from '../../../lib/navigation'
import styles from './Sidebar.module.scss'

const navRouteMap: Record<string, string> = {
  game: '/',
  survival: '/survival',
  blitz: '/blitz',
  pvp: '/pvp',
  questions: '/questions/add',
  people: '/users',
  ratings: '/ratings',
  powerups: '/powerups',
  admin: '/admin',
}

const publicKeys: NavKey[] = ['game', 'people', 'ratings']
const loggedInKeys: NavKey[] = ['game', 'survival', 'blitz', 'pvp', 'questions', 'people', 'ratings', 'powerups']
const adminKeys: NavKey[] = ['game', 'survival', 'blitz', 'pvp', 'questions', 'people', 'ratings', 'powerups', 'admin']

export interface SidebarProps {
  activeNav: string
  isOpen?: boolean
  onClose?: () => void
  isLoggedIn?: boolean
  isAdmin?: boolean
}

export function Sidebar({ activeNav, isOpen, onClose, isLoggedIn = false, isAdmin = false }: SidebarProps) {
  const navigate = useNavigate()

  const items = useMemo(() => {
    const keys = isAdmin ? adminKeys : isLoggedIn ? loggedInKeys : publicKeys
    return navItems.filter((item) => keys.includes(item.key))
  }, [isLoggedIn, isAdmin])

  const handleClick = useCallback((href: string) => {
    navigate({ to: href as any })
    notifyUrlChange()
    onClose?.()
  }, [navigate, onClose])

  return (
    <div className={`l-aside${isOpen ? ' is-open' : ''}`}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть меню">
        &times;
      </button>
      <ul className="b-nav">
        {items.map((item) => (
          <li key={item.key} className={activeNav === item.key ? 'b-nav--active' : ''}>
            <a
              className={styles.navLink}
              href={item.href}
              onClick={(e) => { e.preventDefault(); handleClick(navRouteMap[item.key] || '/') }}
            >
              {item.icon}<span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="b-copyrights">
        <p>&copy; <a href="http://futurico.ru">futurico</a> 2011</p>
        <p>К сожалению, на данный момент уникальная система искусственного интеллекта MEGABRAIN.RU находится в стадии закрытого тестирования.</p>
      </div>
    </div>
  )
}
