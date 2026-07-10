import { useState, useEffect } from 'react'
import { useNavigate, useParams, createRoute } from '@tanstack/react-router'
import { UserProfile } from '../components/organisms/UserProfile/UserProfile'
import { UsersPage } from '../components/organisms/UsersPage/UsersPage'
import { Spinner } from '../components/atoms/Spinner/Spinner'
import { fetchUserProfile, updateProfile, ApiError, type UserProfileData } from '../lib/api'
import { getEloIcon } from '../lib/icons'
import { useAuth } from '../context/auth'
import { Center } from '../components/atoms/Center/Center'
import { rootRoute, PageWrap } from './base'

export const usersListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: function UsersPageRoute() {
    const n = useNavigate()
    return (
      <PageWrap activeNav="people" breadcrumbs={[{ label: 'Люди' }]}>
        <UsersPage onNavigate={(s) => { if (s.startsWith('profile:')) n({ to: '/users/$login', params: { login: s.slice(8) } as any }) }} />
      </PageWrap>
    )
  },
})

export const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$login',
  component: function UserProfilePage() {
    const auth = useAuth()
    const params = useParams({ from: '/users/$login' })
    const login = params.login
    const [profile, setProfile] = useState<UserProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
      setProfile(null); setLoading(true); setError('')
      fetchUserProfile(login).then(setProfile).catch((e) => setError(e instanceof ApiError ? e.message : 'Ошибка')).finally(() => setLoading(false))
    }, [login])

    if (loading) return <PageWrap activeNav="people" breadcrumbs={[{ label: login }]}><Center padding={60}><Spinner size="md" /></Center></PageWrap>
    if (error || !profile) return <PageWrap activeNav="people" breadcrumbs={[{ label: login }]}><Center padding={60}><h2>Не найдено</h2><p style={{ color: '#666' }}>{error || 'Пользователь не существует'}</p></Center></PageWrap>

    const isOwner = auth.user?.id === profile.id
    return (
      <PageWrap activeNav="people" breadcrumbs={[{ label: profile.nickname || login }]}>
        <UserProfile
          user={{ level: profile.level, icon: getEloIcon(profile.elo), nickname: profile.nickname, name: profile.name, login: profile.login, location: profile.location, firstSeen: profile.firstSeen, topics: profile.topics, stats: profile.stats }}
          isOwner={isOwner}
          onSave={isOwner ? async (d) => { const updated = await updateProfile(profile.id, d); setProfile({ ...profile, ...updated }) } : undefined}
        />
      </PageWrap>
    )
  },
})
