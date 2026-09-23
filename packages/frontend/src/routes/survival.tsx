import { useState } from 'react'
import { useNavigate, createRoute } from '@tanstack/react-router'
import { SurvivalSetup } from '../components/organisms/SurvivalSetup/SurvivalSetup'
import { SurvivalBoard } from '../components/organisms/SurvivalBoard/SurvivalBoard'
import { SurvivalResults } from '../components/organisms/SurvivalResults/SurvivalResults'
import { SurvivalLeaderboard } from '../components/organisms/SurvivalResults/SurvivalLeaderboard'
import { Button } from '../components/atoms/Button/Button'
import { Center } from '../components/atoms/Center/Center'
import { startSurvival, fetchPowerupInventory, type SurvivalSummary, type SurvivalStartResult, type PowerupType } from '../lib/api'
import { useAuth } from '../context/auth'
import { rootRoute, PageWrap } from './base'

interface SurvivalState {
  phase: 'setup' | 'playing' | 'results'
  session: SurvivalStartResult | null
  summary: SurvivalSummary | null
}

export const survivalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/survival',
  component: function SurvivalPage() {
    const auth = useAuth()
    const n = useNavigate()
    const [state, setState] = useState<SurvivalState>({ phase: 'setup', session: null, summary: null })
    const [powerupTypes, setPowerupTypes] = useState<PowerupType[]>([])
    const [lastTopicIds, setLastTopicIds] = useState<number[]>([])

    if (!auth.isLoggedIn) {
      return (
        <PageWrap activeNav="survival" breadcrumbs={[{ label: 'Выживание' }]}>
          <Center padding={60}>
            <p>Войдите, чтобы играть в режим выживания.</p>
            <Button variant="primary" size="sm" onClick={() => n({ to: '/login' })} style={{ marginTop: 12 }}>Войти</Button>
          </Center>
        </PageWrap>
      )
    }

    const handleStart = async (topicIds: number[]) => {
      setLastTopicIds(topicIds)
      try {
        const [session, inv] = await Promise.all([
          startSurvival(topicIds),
          fetchPowerupInventory(),
        ])
        // Take up to 3 powerups that are available in survival
        const survivalIds = new Set(['fifty-fifty', 'extra-time', 'shield', 'skip-safe', 'streak-saver', 'peek', 'second-chance', 'head-start', 'extra-slot', 'score-boost'])
        const invIds = inv.inventory.filter((i) => i.quantity > 0 && survivalIds.has(i.powerupId)).map((i) => i.powerupId)
        // Fetch types for those
        const response = await fetch('/api/powerups/types')
        const allTypes: PowerupType[] = await response.json()
        const selected = allTypes.filter((t) => invIds.includes(t.id))
        setPowerupTypes(selected.slice(0, 3))
        setState({ phase: 'playing', session, summary: null })
      } catch {
        alert('Не удалось начать игру. Попробуйте снова.')
      }
    }

    const handleFinish = (summary: SurvivalSummary) => {
      setState({ phase: 'results', session: null, summary })
    }

    const handlePlayAgain = () => {
      if (lastTopicIds.length > 0) {
        handleStart(lastTopicIds)
      } else {
        setState({ phase: 'setup', session: null, summary: null })
      }
    }

    const handleViewLeaderboard = () => {
      n({ to: '/survival/leaderboard' as any })
    }

    if (state.phase === 'playing' && state.session) {
      return (
        <PageWrap activeNav="survival" breadcrumbs={[{ label: 'Выживание' }, { label: 'Идёт игра...' }]}>
          <SurvivalBoard
            sessionId={state.session.sessionId}
            initialQuestion={state.session.question}
            initialTimeLimit={state.session.timeLimitSeconds}
            initialLives={state.session.lives}
            initialStreak={state.session.streak}
            initialScore={state.session.score}
            initialDifficulty={state.session.difficulty}
            onFinish={handleFinish}
            powerups={powerupTypes}
          />
        </PageWrap>
      )
    }

    if (state.phase === 'results' && state.summary) {
      return (
        <PageWrap activeNav="survival" breadcrumbs={[{ label: 'Выживание' }, { label: 'Результаты' }]}>
          <SurvivalResults summary={state.summary} />
          <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button variant="primary" size="sm" onClick={handlePlayAgain}>
              Играть снова
            </Button>
            <Button variant="link" size="sm" onClick={handleViewLeaderboard}>
              {'\u{1F3C6}'} Таблица лидеров
            </Button>
          </div>
        </PageWrap>
      )
    }

    return (
      <PageWrap activeNav="survival" breadcrumbs={[{ label: 'Выживание' }]}>
        <SurvivalSetup
          categories={auth.categories}
          bestScore={auth.user?.best_survival_score ?? 0}
          bestStreak={auth.user?.best_survival_streak ?? 0}
          onStart={handleStart}
          onViewLeaderboard={handleViewLeaderboard}
        />
      </PageWrap>
    )
  },
})

export const survivalLeaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/survival/leaderboard',
  component: function SurvivalLeaderboardPage() {
    return (
      <PageWrap activeNav="survival" breadcrumbs={[{ label: 'Выживание' }, { label: 'Лидерборд' }]}>
        <SurvivalLeaderboard />
      </PageWrap>
    )
  },
})
