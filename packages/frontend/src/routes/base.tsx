import { useEffect, type ReactNode } from 'react'
import { Outlet, createRootRoute, useNavigate } from '@tanstack/react-router'
import { TooltipProvider } from '../components/atoms/Tooltip/Tooltip'
import { Layout } from '../components/organisms/Layout/Layout'
import { useToast } from '../components/molecules/ToastContainer/ToastContainer'
import { useAuth } from '../context/auth'
import { ROUTES, navKeyOf, type Role, type RouteId } from '../lib/routes'
import { PageContent } from '../components/molecules/PageContent/PageContent'
import { EmptyState } from '../components/molecules/EmptyState/EmptyState'
import { Button } from '../components/atoms/Button/Button'

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

/**
 * Каркас страницы: крошки, заголовок документа и подсветка меню берутся из карты маршрутов
 * (`lib/routes.ts`), поэтому странице достаточно указать свой route.
 */
export function PageWrap({ children, route, crumbTrail, activeNav }: {
  children: ReactNode
  route: RouteId
  /** Переопределить цепочку крошек (динамические страницы: профиль, партия) */
  crumbTrail?: string[]
  /** Переопределить подсветку пункта меню */
  activeNav?: string
}) {
  const auth = useAuth()
  const n = useNavigate()
  const meta = ROUTES[route]
  const breadcrumbs = (crumbTrail ?? meta.breadcrumbs).map((label) => ({ label }))
  const nav = activeNav ?? navKeyOf(route)

  // Единая защита страниц: auth-разделы требуют входа, admin — прав администратора
  const role: Role = auth.isAdmin ? 'admin' : auth.isLoggedIn ? 'auth' : 'public'
  const allowed = meta.roles.length === 0 || meta.roles.includes(role)

  useEffect(() => {
    document.title = `Megabrain2 — ${meta.title}`
  }, [meta.title])

  return (
    <Layout
      activeNav={nav}
      breadcrumbs={breadcrumbs}
      isLoggedIn={auth.isLoggedIn}
      nickname={auth.user?.nickname}
      login={auth.user?.login}
      isAdmin={auth.isAdmin}
      onLogout={auth.logout}
    >
      {allowed ? children : (
        <PageContent width="narrow">
          <EmptyState
            icon={auth.isLoggedIn ? '\u{1F512}' : '\u2192'}
            title={auth.isLoggedIn ? 'Нужны права администратора' : 'Нужен вход'}
            description={auth.isLoggedIn
              ? 'Раздел доступен только администраторам.'
              : 'Войдите или зарегистрируйтесь, чтобы открыть этот раздел.'}
            action={!auth.isLoggedIn
              ? <Button variant="primary" onClick={() => n({ to: '/login' as any })}>Войти</Button>
              : undefined}
          />
        </PageContent>
      )}
    </Layout>
  )
}
