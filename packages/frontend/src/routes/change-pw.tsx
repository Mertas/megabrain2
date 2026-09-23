import { createRoute } from '@tanstack/react-router'
import { ChangePasswordForm } from '../components/molecules/ChangePasswordForm/ChangePasswordForm'
import { PageHeader } from '../components/molecules/PageHeader/PageHeader'
import { PageContent } from '../components/molecules/PageContent/PageContent'
import { rootRoute, PageWrap } from './base'

export const changePwRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/change-password',
  component: function ChangePwPage() {
    return (
      <PageWrap route="changePassword">
        <PageContent width="narrow">
          <PageHeader icon={'\u{1F511}'} title="Смена пароля" description="Новый пароль — минимум 8 символов, с заглавной, строчной буквой и цифрой." />
          <ChangePasswordForm />
        </PageContent>
      </PageWrap>
    )
  },
})
