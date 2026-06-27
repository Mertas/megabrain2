import { Layout } from './Layout/Layout'
import type { NavKey } from '../../lib/navItems'
import type { ReactNode } from 'react'

interface FixtureLayoutProps {
  title: string
  nav?: NavKey
  children: ReactNode
}

export function FixtureLayout({ title, nav = 'game', children }: FixtureLayoutProps) {
  return (
    <Layout activeNav={nav} breadcrumbs={[{ label: 'Cosmos' }, { label: title }]}>
      <h1>{title}</h1>
      {children}
    </Layout>
  )
}
