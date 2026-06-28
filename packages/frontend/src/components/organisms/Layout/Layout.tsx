import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Sidebar } from '../Sidebar/Sidebar'
import { Breadcrumbs, type BreadcrumbItem } from '../../molecules/Breadcrumbs/Breadcrumbs'
import type { ReactNode } from 'react'
import { notifyUrlChange } from '../../../lib/navigation'
import '../../../styles/global.scss'
import styles from './Layout.module.scss'

export interface LayoutProps {
  activeNav: string
  breadcrumbs: BreadcrumbItem[]
  isLoggedIn?: boolean
  nickname?: string
  login?: string
  isAdmin?: boolean
  onLogout?: () => void
  children: ReactNode
}

export function Layout({ activeNav, breadcrumbs, isLoggedIn = false, nickname, login, isAdmin = false, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="l-page">
      <div className="l-header">
        <button
          className={styles.hamburger}
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
        >
          <span />
          <span />
          <span />
        </button>
        <button className={styles.logoBtn} onClick={() => { navigate({ to: '/' }); notifyUrlChange() }}>
          megabrain
        </button>
        <div className="b-user-auth">
          {isLoggedIn ? (
            <span>
              <a href={`/users/${login || nickname}`} onClick={(e) => { e.preventDefault(); navigate({ to: '/users/' + (login || nickname) as any }); notifyUrlChange() }}>{nickname}</a>
              {' | '}
              <a href="/logout" onClick={(e) => { e.preventDefault(); onLogout?.() }}>выйти</a>
            </span>
          ) : (
            <span>
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate({ to: '/login' }); notifyUrlChange() }}>войти</a>
              {' | '}
              <a href="/register" onClick={(e) => { e.preventDefault(); navigate({ to: '/register' }); notifyUrlChange() }}>зарегистрироваться</a>
            </span>
          )}
        </div>
      </div>

      <Breadcrumbs items={breadcrumbs} />

      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar activeNav={activeNav} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isLoggedIn={isLoggedIn} isAdmin={isAdmin} />

      <div className="l-content">
        <div className="l-i-content">
          {children}
        </div>
      </div>
    </div>
  )
}
