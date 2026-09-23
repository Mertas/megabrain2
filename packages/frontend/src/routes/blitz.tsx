import { createRoute } from '@tanstack/react-router'
import { Blitz } from '../components/organisms/Blitz/Blitz'
import { rootRoute, PageWrap } from './base'
import { useAuth } from '../context/auth'

export const blitzRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blitz',
  component: function BlitzPage() {
    const auth = useAuth()
    const token = localStorage.getItem('accessToken') || ''

    return (
      <PageWrap route="blitz">
        <Blitz categories={auth.categories} token={token} />
      </PageWrap>
    )
  },
})
