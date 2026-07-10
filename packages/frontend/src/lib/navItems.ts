export type NavKey = 'game' | 'survival' | 'blitz' | 'pvp' | 'questions' | 'people' | 'ratings' | 'powerups' | 'admin'

export interface NavItem {
  key: NavKey
  icon: string
  label: string
  href: string
}

export const navItems: NavItem[] = [
  { key: 'game', icon: '\u00A7', label: 'Игра', href: '/' },
  { key: 'survival', icon: '\u2665', label: 'Выживание', href: '/survival' },
  { key: 'blitz', icon: '\u2694', label: 'Блиц-дуэль', href: '/blitz' },
  { key: 'pvp', icon: '\u2694', label: 'PvP', href: '/pvp' },
  { key: 'questions', icon: '\u2692', label: 'Вопросы', href: '/questions/add' },
  { key: 'people', icon: '\u262D', label: 'Люди', href: '/users' },
  { key: 'ratings', icon: '\u2721', label: 'Рейтинги', href: '/ratings' },
  { key: 'powerups', icon: '\u2728', label: 'Power-ups', href: '/powerups' },
  { key: 'admin', icon: '\u2699', label: 'Админка', href: '/admin' },
]
