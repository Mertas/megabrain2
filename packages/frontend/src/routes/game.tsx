import { useState } from 'react'
import { useNavigate, createRoute } from '@tanstack/react-router'
import { GameBoard, type GameResult } from '../components/organisms/GameBoard/GameBoard'
import { GameResults } from '../components/organisms/GameResults/GameResults'
import { Button } from '../components/atoms/Button/Button'
import { submitGameResult, type GameScoreResult } from '../lib/api'
import { getGameStore, setGameStore, clearGameStore } from '../lib/game-store'
import { useAuth } from '../context/auth'
import { rootRoute, PageWrap } from './base'

export const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/game',
  component: function GamePage() {
    const auth = useAuth()
    const n = useNavigate()
    const store = getGameStore()
    const [finished, setFinished] = useState(false)

    if (store.questions.length === 0) {
      return (
        <PageWrap activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Нет вопросов' }]}>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p>Нет вопросов. Начните новую игру.</p>
            <Button variant="primary" size="sm" onClick={() => n({ to: '/' })} style={{ marginTop: 12 }}>Новая игра</Button>
          </div>
        </PageWrap>
      )
    }

    const handleFinish = async (r: GameResult) => {
      let sr: GameScoreResult | null = null
      if (auth.isLoggedIn) {
        try {
          sr = await submitGameResult({
            timeMode: store.timeMode, timeSeconds: store.timeSeconds,
            total: r.total, correct: r.correct,
            questions: r.questions.map((q) => ({
              questionId: q.question.id, correct: q.selectedIndex === q.correctIndex, timeElapsedCs: q.timeElapsedCs,
            })),
          })
        } catch { sr = null }
      }
      setGameStore({ ...store, result: r, scoreResult: sr })
      setFinished(true)
    }

    if (finished) {
      const s = getGameStore()
      return (
        <PageWrap activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Результаты' }]}>
          <GameResults result={s.result!} score={s.scoreResult || undefined} />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button variant="link" size="sm" onClick={() => { clearGameStore(); n({ to: '/' }) }}>Новая игра</Button>
          </div>
        </PageWrap>
      )
    }

    return (
      <PageWrap activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Астрономия' }]}>
        <GameBoard questions={store.questions} timeMode={store.timeMode} timeSeconds={store.timeSeconds} isAdmin={auth.isAdmin} onFinish={handleFinish} />
      </PageWrap>
    )
  },
})
