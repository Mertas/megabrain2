import { createRouter } from '@tanstack/react-router'
import { rootRoute } from './routes/base'
import { indexRoute } from './routes/home'
import { loginRoute, registerRoute, forgotRoute, resetRoute } from './routes/auth'
import { changePwRoute } from './routes/change-pw'
import { gameRoute } from './routes/game'
import { addQRoute, adminRoute, pvpRoute, ratingsRoute } from './routes/misc'
import { usersListRoute, userRoute } from './routes/users'
import { survivalRoute, survivalLeaderboardRoute } from './routes/survival'
import { blitzRoute } from './routes/blitz'
import { powerupsRoute } from './routes/powerups'
import { NotFoundPage } from './routes/not-found'
import './styles/global.scss'

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  forgotRoute,
  resetRoute,
  changePwRoute,
  gameRoute,
  addQRoute,
  adminRoute,
  usersListRoute,
  userRoute,
  pvpRoute,
  ratingsRoute,
  survivalRoute,
  survivalLeaderboardRoute,
  blitzRoute,
  powerupsRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: false,
  defaultNotFoundComponent: NotFoundPage,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
