import { createRouter } from '@tanstack/react-router'
import { rootRoute } from './routes/base'
import { indexRoute } from './routes/home'
import { loginRoute, registerRoute, forgotRoute, resetRoute } from './routes/auth'
import { changePwRoute } from './routes/change-pw'
import { gameRoute } from './routes/game'
import { addQRoute, adminRoute, pvpRoute, ratingsRoute } from './routes/misc'
import { usersListRoute, userRoute } from './routes/users'
import { notFoundRoute } from './routes/not-found'
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
  notFoundRoute, // must be last — catch-all 404
])

export const router = createRouter({
  routeTree,
  defaultPreload: false,
  defaultNotFoundComponent: () => null, // handled by * route
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
