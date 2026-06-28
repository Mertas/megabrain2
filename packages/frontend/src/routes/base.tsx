import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TooltipProvider } from '../components/atoms/Tooltip/Tooltip'
import { Layout } from '../components/organisms/Layout/Layout'
import { useToast } from '../components/molecules/ToastContainer/ToastContainer'
import { useAuth } from '../context/auth'
import type { ReactNode } from 'react'

function RootLayout() {
  const { toasts, remove, ToastContainer } = useToast()
  return (
    <TooltipProvider>
      <ToastContainer toasts={toasts} onRemove={remove} />
      <Outlet />
    </TooltipProvider>
  )
}

export const rootRoute = createRootRoute({
  component: RootLayout,
})

export function PageWrap({ children, activeNav, breadcrumbs }: {
  children: ReactNode
  activeNav: string
  breadcrumbs: { label: string }[]
}) {
  const auth = useAuth()
  return (
    <Layout
      activeNav={activeNav}
      breadcrumbs={breadcrumbs}
      isLoggedIn={auth.isLoggedIn}
      nickname={auth.user?.nickname}
      login={auth.user?.login}
      isAdmin={auth.isAdmin}
      onLogout={auth.logout}
    >
      {children}
    </Layout>
  )
}
