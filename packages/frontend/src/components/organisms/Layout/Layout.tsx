import { Sidebar } from '../Sidebar/Sidebar'
import { Breadcrumbs, type BreadcrumbItem } from '../../molecules/Breadcrumbs/Breadcrumbs'
import type { ReactNode } from 'react'
import '../../../styles/global.scss'
import styles from './Layout.module.scss'

export interface LayoutProps {
  activeNav: string
  breadcrumbs: BreadcrumbItem[]
  isLoggedIn?: boolean
  nickname?: string
  onNavigate?: (step: string) => void
  onLogout?: () => void
  children: ReactNode
}

export function Layout({ activeNav, breadcrumbs, isLoggedIn = false, nickname, onNavigate, onLogout, children }: LayoutProps) {
  return (
    <div className="l-page">
      <div className="l-header">
        <button className={styles.logoBtn} onClick={() => onNavigate?.('setup')}>
          megabrain
        </button>
        <div className="b-user-auth">
          {isLoggedIn ? (
            <span>
              <a href="/profile" onClick={(e) => { e.preventDefault(); onNavigate?.('setup') }}>{nickname}</a>
              {' | '}
              <a href="/logout" onClick={(e) => { e.preventDefault(); onLogout?.() }}>выйти</a>
            </span>
          ) : (
            <span>
              <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate?.('login') }}>войти</a>
              {' | '}
              <a href="/register" onClick={(e) => { e.preventDefault(); onNavigate?.('register') }}>зарегистрироваться</a>
            </span>
          )}
        </div>
      </div>

      <Breadcrumbs items={breadcrumbs} />
      <Sidebar activeNav={activeNav} onNavigate={onNavigate} />

      <div className="l-content">
        <div className="l-i-content">
          {children}
        </div>
      </div>
    </div>
  )
}
