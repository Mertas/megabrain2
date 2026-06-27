export type NavKey = 'game' | 'pvp' | 'questions' | 'people' | 'ratings'

export interface NavItem {
  key: NavKey
  icon: string
  label: string
  href: string
}

export const navItems: NavItem[] = [
  { key: 'game', icon: '\u00A7', label: 'Игра', href: '/' },
  { key: 'pvp', icon: '\u2694', label: 'PvP', href: '/pvp' },
  { key: 'questions', icon: '\u2692', label: 'Вопросы', href: '/questions/add' },
  { key: 'people', icon: '\u262D', label: 'Люди', href: '/users' },
  { key: 'ratings', icon: '\u2721', label: 'Рейтинги', href: '/ratings' },
]
