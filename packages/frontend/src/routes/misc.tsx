import { createRoute } from '@tanstack/react-router'
import { AddQuestions } from '../components/organisms/AddQuestions/AddQuestions'
import { AdminPage } from '../components/organisms/AdminPage/AdminPage'
import { PvP, PvPRatings } from '../components/organisms/PvP/PvP'
import { useAuth } from '../context/auth'
import { Center } from '../components/atoms/Center/Center'
import { rootRoute, PageWrap } from './base'

export const addQRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/questions/add',
  component: function AddQPage() {
    const auth = useAuth()
    return (
      <PageWrap route="questions">
        <AddQuestions categories={auth.categories} topics={auth.topics} />
      </PageWrap>
    )
  },
})

export const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: function AdminPageRoute() {
    const auth = useAuth()
    if (!auth.isAdmin) return <PageWrap route="admin"><Center padding={60}>Требуются права администратора</Center></PageWrap>
    return <PageWrap route="admin"><AdminPage /></PageWrap>
  },
})

export const pvpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pvp',
  component: function PvPPage() {
    return <PageWrap route="pvp"><PvP /></PageWrap>
  },
})

export const ratingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ratings',
  component: function RatingsPage() {
    return <PageWrap route="ratings"><PvPRatings /></PageWrap>
  },
})
