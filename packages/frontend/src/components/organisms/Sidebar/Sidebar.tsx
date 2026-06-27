import { navItems } from '../../../lib/navItems'
import styles from './Sidebar.module.scss'

const navRouteMap: Record<string, string> = {
  game: 'setup',
  pvp: 'setup',
  questions: 'add-questions',
  people: 'setup',
  ratings: 'setup',
}

export interface SidebarProps {
  activeNav: string
  onNavigate?: (step: string) => void
}

export function Sidebar({ activeNav, onNavigate }: SidebarProps) {
  return (
    <div className="l-aside">
      <ul className="b-nav">
        {navItems.map((item) => (
          <li key={item.key} className={activeNav === item.key ? 'b-nav--active' : ''}>
            <button
              className={styles.navBtn}
              onClick={() => onNavigate?.(navRouteMap[item.key] || 'setup')}
            >
              {item.icon}<span>{item.label}</span>
            </button>
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
