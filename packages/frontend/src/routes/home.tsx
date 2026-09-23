import { useNavigate, createRoute } from '@tanstack/react-router'
import { PublicGame } from '../components/organisms/PublicGame/PublicGame'
import { NewGameForm, type GameConfig } from '../components/organisms/NewGameForm/NewGameForm'
import { fetchQuestions } from '../lib/api'
import { setGameStore } from '../lib/game-store'
import { useAuth } from '../context/auth'
import { rootRoute, PageWrap } from './base'

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function IndexPage() {
    const auth = useAuth()
    const n = useNavigate()

    if (!auth.isLoggedIn) {
      return <PublicGame onNavigate={(s) => n({ to: s as any })} onLoginSuccess={() => { window.location.reload() }} />
    }

    const handleStart = async (config: GameConfig) => {
      const qs = await fetchQuestions(config.subtopicIds, config.questionCount, true)
      setGameStore({
        questions: qs.map((q) => ({ id: q.id, text: q.text, imageUrl: q.image_url || undefined, answers: q.answers, correctIndex: -1, note: q.note || undefined })),
        timeMode: config.timeMode,
        timeSeconds: config.timeValueSeconds,
        subtopicIds: config.subtopicIds,
        questionCount: config.questionCount,
        powerupIds: config.powerupIds,
        result: null,
        scoreResult: null,
      })
      auth.saveConfig({ subtopicIds: config.subtopicIds, timeMode: config.timeMode, timeValue: String(config.timeValueSeconds), questionCount: String(config.questionCount), onlyNew: config.onlyNew })
      n({ to: '/game' })
    }

    return (
      <PageWrap route="home">
        <NewGameForm categories={auth.categories} lastConfig={auth.lastConfig} onStart={handleStart} />
      </PageWrap>
    )
  },
})
