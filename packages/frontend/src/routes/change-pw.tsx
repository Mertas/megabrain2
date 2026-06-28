import { createRoute } from '@tanstack/react-router'
import { ChangePasswordForm } from '../components/molecules/ChangePasswordForm/ChangePasswordForm'
import { rootRoute, PageWrap } from './base'

export const changePwRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/change-password',
  component: function ChangePwPage() {
    return <PageWrap activeNav="game" breadcrumbs={[{ label: 'Смена пароля' }]}><ChangePasswordForm /></PageWrap>
  },
})
