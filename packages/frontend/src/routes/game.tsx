import { useState, useEffect } from 'react'
import { useNavigate, createRoute } from '@tanstack/react-router'
import { GameBoard, type GameResult } from '../components/organisms/GameBoard/GameBoard'
import { GameResults } from '../components/organisms/GameResults/GameResults'
import { Button } from '../components/atoms/Button/Button'
import { Center } from '../components/atoms/Center/Center'
import { Text } from '../components/atoms/Text/Text'
import { submitGameResult, fetchPowerupTypes, fetchQuestions, type GameScoreResult, type PowerupType } from '../lib/api'
import { getGameStore, setGameStore } from '../lib/game-store'
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
    const [powerupTypes, setPowerupTypes] = useState<PowerupType[]>([])

    useEffect(() => {
      if (store.powerupIds.length > 0) {
        fetchPowerupTypes().then((all) => {
          setPowerupTypes(all.filter((t) => store.powerupIds.includes(t.id)))
        }).catch(() => {})
      }
    }, [store.powerupIds])

    if (store.questions.length === 0) {
      return (
        <PageWrap activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Нет вопросов' }]}>
          <Center padding={60}>
            <Text as="p">Нет вопросов. Начните новую игру.</Text>
            <Button variant="primary" size="sm" onClick={() => n({ to: '/' })} style={{ marginTop: 12 }}>Новая игра</Button>
          </Center>
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

    const handlePlayAgain = async () => {
      const s = getGameStore()
      try {
        const qs = await fetchQuestions(s.subtopicIds, s.questionCount, true)
        setGameStore({
          ...s,
          questions: qs.map((q) => ({ id: q.id, text: q.text, imageUrl: q.image_url || undefined, answers: q.answers, correctIndex: -1, note: q.note || undefined })),
          result: null,
          scoreResult: null,
        })
        setFinished(false)
      } catch {
        n({ to: '/' })
      }
    }

    if (finished) {
      const s = getGameStore()
      return (
        <PageWrap activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Результаты' }]}>
          <GameResults result={s.result!} score={s.scoreResult || undefined} />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button variant="link" size="sm" onClick={handlePlayAgain}>Новая игра</Button>
          </div>
        </PageWrap>
      )
    }

    return (
      <PageWrap activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Астрономия' }]}>
        <GameBoard questions={store.questions} timeMode={store.timeMode} timeSeconds={store.timeSeconds} isAdmin={auth.isAdmin} powerups={powerupTypes} onFinish={handleFinish} />
      </PageWrap>
    )
  },
})
