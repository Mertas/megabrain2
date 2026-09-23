/**
 * Единая карта маршрутов: заголовок, крошки, пункт меню, группа и роли — в одном месте.
 * Отсюда берут данные PageWrap (крошки/title/подсветка меню) и Sidebar (состав и порядок меню).
 */

export type Role = 'public' | 'auth' | 'admin'

export type RouteId =
  | 'home' | 'game' | 'survival' | 'survivalLeaderboard' | 'blitz' | 'pvp'
  | 'ratings' | 'users' | 'user' | 'questions' | 'admin' | 'powerups'
  | 'login' | 'register' | 'forgot' | 'reset' | 'changePassword' | 'notFound'

export interface RouteMeta {
  /** Заголовок страницы (шапка + <title>) */
  title: string
  /** Цепочка крошек, первая — раздел */
  breadcrumbs: string[]
  /** URL пункта меню */
  path?: string
  icon?: string
  /** Показывать в боковом меню */
  nav?: boolean
  /** Какой пункт меню подсвечивать (по умолчанию — сам ключ) */
  navKey?: string
  /** Группа меню */
  group?: string
  /** Кому доступно; public — всем, auth — вошедшим, admin — админам */
  roles: Role[]
}

/** Порядок групп в меню */
export const NAV_GROUPS = ['Игра', 'Соревнование', 'Контент', 'Сообщество', 'Магазин', 'Админка'] as const

export const ROUTES: Record<RouteId, RouteMeta> = {
  home: {
    title: 'Новая игра',
    breadcrumbs: ['Игра', 'Новая игра'],
    path: '/',
    icon: '§',
    nav: true,
    navKey: 'home',
    group: 'Игра',
    roles: ['public', 'auth', 'admin'],
  },
  game: {
    title: 'Партия',
    breadcrumbs: ['Игра', 'Партия'],
    navKey: 'home',
    roles: ['auth', 'admin'],
  },
  survival: {
    title: 'Выживание',
    breadcrumbs: ['Выживание'],
    path: '/survival',
    icon: '♥',
    nav: true,
    group: 'Игра',
    roles: ['auth', 'admin'],
  },
  survivalLeaderboard: {
    title: 'Таблица лидеров',
    breadcrumbs: ['Выживание', 'Таблица лидеров'],
    navKey: 'survival',
    roles: ['auth', 'admin'],
  },
  blitz: {
    title: 'Блиц-дуэль',
    breadcrumbs: ['Блиц-дуэль'],
    path: '/blitz',
    icon: '⚔',
    nav: true,
    group: 'Игра',
    roles: ['auth', 'admin'],
  },
  pvp: {
    title: 'PvP',
    breadcrumbs: ['PvP'],
    path: '/pvp',
    icon: '⚔',
    nav: true,
    group: 'Игра',
    roles: ['auth', 'admin'],
  },
  ratings: {
    title: 'Рейтинги',
    breadcrumbs: ['Рейтинги'],
    path: '/ratings',
    icon: '✡',
    nav: true,
    group: 'Соревнование',
    roles: ['public', 'auth', 'admin'],
  },
  users: {
    title: 'Люди',
    breadcrumbs: ['Люди'],
    path: '/users',
    icon: '☭',
    nav: true,
    group: 'Сообщество',
    roles: ['public', 'auth', 'admin'],
  },
  user: {
    title: 'Профиль',
    breadcrumbs: ['Люди', 'Профиль'],
    navKey: 'users',
    roles: ['public', 'auth', 'admin'],
  },
  questions: {
    title: 'Вопросы',
    breadcrumbs: ['Вопросы', 'Добавить'],
    path: '/questions/add',
    icon: '⚒',
    nav: true,
    group: 'Контент',
    roles: ['auth', 'admin'],
  },
  admin: {
    title: 'Админка',
    breadcrumbs: ['Админка'],
    path: '/admin',
    icon: '⚙',
    nav: true,
    group: 'Админка',
    roles: ['admin'],
  },
  powerups: {
    title: 'Power-ups',
    breadcrumbs: ['Power-ups'],
    path: '/powerups',
    icon: '✨',
    nav: true,
    group: 'Магазин',
    roles: ['auth', 'admin'],
  },
  login: { title: 'Вход', breadcrumbs: ['Вход'], roles: ['public', 'auth', 'admin'] },
  register: { title: 'Регистрация', breadcrumbs: ['Регистрация'], roles: ['public', 'auth', 'admin'] },
  forgot: { title: 'Восстановление пароля', breadcrumbs: ['Вход', 'Восстановление'], navKey: 'login', roles: ['public', 'auth', 'admin'] },
  reset: { title: 'Новый пароль', breadcrumbs: ['Вход', 'Новый пароль'], navKey: 'login', roles: ['public', 'auth', 'admin'] },
  changePassword: { title: 'Смена пароля', breadcrumbs: ['Профиль', 'Смена пароля'], roles: ['auth', 'admin'] },
  notFound: { title: 'Страница не найдена', breadcrumbs: ['404'], roles: ['public', 'auth', 'admin'] },
}

/** Пункты меню для роли: [{group, items}] в порядке NAV_GROUPS */
export function navSections(role: Role): { group: string; items: { id: RouteId; meta: RouteMeta }[] }[] {
  const order: Record<Role, number> = { public: 0, auth: 1, admin: 2 }
  const allowed = (meta: RouteMeta) =>
    meta.nav === true && meta.roles.some((r) => order[r] <= order[role])

  return NAV_GROUPS
    .map((group) => ({
      group,
      items: (Object.keys(ROUTES) as RouteId[])
        .filter((id) => ROUTES[id].group === group && allowed(ROUTES[id]))
        .map((id) => ({ id, meta: ROUTES[id] })),
    }))
    .filter((section) => section.items.length > 0)
}

/** Какой пункт меню подсвечивать для маршрута */
export function navKeyOf(id: RouteId): string {
  return ROUTES[id].navKey || id
}
