import { createRoute } from '@tanstack/react-router'
import { PowerupShop } from '../components/organisms/PowerupShop/PowerupShop'
import { rootRoute, PageWrap } from './base'

export const powerupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/powerups',
  component: function PowerupsPage() {
    return (
      <PageWrap activeNav="powerups" breadcrumbs={[{ label: 'Power-ups' }]}>
        <PowerupShop />
      </PageWrap>
    )
  },
})
