import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Button } from '../../atoms/Button/Button'
import { Select } from '../../atoms/Select/Select'
import { Timer } from '../../molecules/Timer/Timer'
import { AnswerGrid, type AnswerCheckResult } from '../../molecules/AnswerGrid/AnswerGrid'
import { TopicList } from '../TopicList/TopicList'
import { PageHeader } from '../../molecules/PageHeader/PageHeader'
import { ConfigCard } from '../../molecules/ConfigCard/ConfigCard'
import { PowerupSelector } from '../../molecules/PowerupSelector/PowerupSelector'
import { Text } from '../../atoms/Text/Text'
import { PageContent } from '../../molecules/PageContent/PageContent'
import { SetupActions } from '../../molecules/SetupActions/SetupActions'
import {
  connect, disconnect, joinQueue, cancelQueue, sendAnswer, getSocket, usePowerup,
  type BlitzMatchFound, type BlitzRoundResult, type BlitzGameResult,
} from '../../../lib/blitz-socket'
import { fetchPowerupInventory, type ApiCategory, type PowerupType } from '../../../lib/api'
import { PowerupBar, type ActivePowerup } from '../../molecules/PowerupBar/PowerupBar'
import type { Topic } from '../../molecules/TopicCard/TopicCard'
import styles from './Blitz.module.scss'

type Phase = 'setup' | 'waiting' | 'countdown' | 'playing' | 'round-result' | 'results'

const ROUND_OPTIONS = [
  { value: '5', label: 'До 3 побед (best of 5)' },
  { value: '7', label: 'До 4 побед (best of 7)' },
  { value: '9', label: 'До 5 побед (best of 9)' },
]

const TIME_OPTIONS = [
  { value: '10', label: '10 секунд' },
  { value: '15', label: '15 секунд' },
  { value: '20', label: '20 секунд' },
]

const blitzRules = [
  { icon: '\u26A1', text: 'Один вопрос на двоих — кто первый ответил правильно, забирает раунд' },
  { icon: '\u{1F6AB}', text: 'Одна попытка на раунд. Неверный ответ — вы блокируетесь до конца раунда' },
  { icon: '\u{1F3C6}', text: `Best of 5, 7 или 9: побеждает первый, выигравший больше половины раундов` },
]

interface Props {
  categories: ApiCategory[]
  token: string
}

export function Blitz({ categories, token }: Props) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [roundCount, setRoundCount] = useState(5)
  const [timePerRound, setTimePerRound] = useState(15)
  const [error, setError] = useState('')
  const mountedRef = useRef(true)

  const [match, setMatch] = useState<BlitzMatchFound | null>(null)
  const [question, setQuestion] = useState<{ id: number; text: string; answers: string[]; note?: string | null } | null>(null)
  const [roundNumber, setRoundNumber] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [oppScore, setOppScore] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const [opponentAnswered, setOpponentAnswered] = useState(false)
  const [roundResult, setRoundResult] = useState<BlitzRoundResult | null>(null)
  const [gameResult, setGameResult] = useState<BlitzGameResult | null>(null)
  const [timeMs, setTimeMs] = useState(0)
  const [paused, setPaused] = useState(false)
  const [oppDisconnected, setOppDisconnected] = useState(false)

  const [powerupTypes, setPowerupTypes] = useState<PowerupType[]>([])
  const [selectedPowerupIds, setSelectedPowerupIds] = useState<string[]>([])
  const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([])

  const timeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    fetchPowerupInventory().then((inv) => {
      const pIds = inv.inventory.filter((i) => i.quantity > 0).map((i) => i.powerupId)
      fetch('/api/powerups/types').then((r) => r.json()).then((allTypes: PowerupType[]) => {
        const available = allTypes.filter((t) => pIds.includes(t.id) && t.available_in !== 'solo')
        setPowerupTypes(available.slice(0, 3))
      }).catch(() => {})
    }).catch(() => {})
  }, [])

  const topicData: Topic[] = useMemo(() => categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    subtopics: cat.topics.map((t) => ({ id: t.id, name: t.name })),
  })), [categories])

  const handleSelectSubtopic = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSelectAll = (topicId: number) => {
    const topic = topicData.find((t) => t.id === topicId)
    if (!topic) return
    const ids = topic.subtopics.map((s) => s.id)
    const allSelected = ids.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((x) => !ids.includes(x)))
    } else {
      const toAdd = ids.filter((id) => !selectedIds.includes(id))
      setSelectedIds((prev) => [...prev, ...toAdd])
    }
  }

  const handleStart = () => {
    if (selectedIds.length === 0) {
      setError('Выберите хотя бы одну тему')
      return
    }
    setError('')
    setOppDisconnected(false)
    try {
      connect(token)
      const sock = getSocket()
      if (!sock) { setError('Ошибка подключения'); return }

      sock.off('blitz:waiting')
      sock.off('blitz:cancelled')
      sock.off('blitz:error')
      sock.off('blitz:match-found')
      sock.off('blitz:countdown')
      sock.off('blitz:round-start')
      sock.off('blitz:opponent-answered')
      sock.off('blitz:round-result')
      sock.off('blitz:game-result')
      sock.off('blitz:opponent-disconnected')
      sock.off('blitz:powerup-opponent')

      sock.on('blitz:waiting', () => setPhase('waiting'))
      sock.on('blitz:cancelled', () => { setPhase('setup'); disconnect() })
      sock.on('blitz:error', (data: { message: string }) => setError(data.message))

      sock.on('blitz:match-found', (data: BlitzMatchFound) => {
        setMatch(data)
        setMyScore(0)
        setOppScore(0)
        setError('')
        setOppDisconnected(false)
      })

      sock.on('blitz:countdown', (data: { seconds: number }) => {
        setPhase('countdown')
        setCountdown(data.seconds)
      })

      sock.on('blitz:round-start', (data: { roundNumber: number; question: { id: number; text: string; answers: string[]; note?: string | null }; yourScore: number; opponentScore: number }) => {
        setPhase('playing')
        setRoundNumber(data.roundNumber)
        setQuestion(data.question)
        setMyScore(data.yourScore)
        setOppScore(data.opponentScore)
        setOpponentAnswered(false)
        setRoundResult(null)
        setPaused(false)
        timeRef.current = 0
        setTimeMs(0)
        startTimeRef.current = Date.now()
        startTimer()
      })

      sock.on('blitz:opponent-answered', () => setOpponentAnswered(true))

      sock.on('blitz:round-result', (data: BlitzRoundResult) => {
        stopTimer()
        setPaused(true)
        setPhase('round-result')
        setRoundResult(data)
        setMyScore(data.yourScore)
        setOppScore(data.opponentScore)
      })

      sock.on('blitz:game-result', (data: BlitzGameResult) => {
        setPhase('results')
        setGameResult(data)
      })

      sock.on('blitz:opponent-disconnected', () => {
        setError('Соперник отключился. Ожидание 15 сек...')
        setOppDisconnected(true)
      })

      sock.on('blitz:powerup-opponent', (data: { powerupId: string; effect: string }) => {
        if (data.powerupId === 'freeze') {
          timeRef.current = Math.max(0, timeRef.current - 300)
        }
      })

      joinQueue(selectedIds, roundCount, timePerRound, selectedPowerupIds)
    } catch {
      setError('Не удалось подключиться к серверу')
    }
  }

  const handleAnswer = useCallback(async (answerText: string): Promise<AnswerCheckResult> => {
    if (paused) return { correct: false, correctAnswer: '' }
    setPaused(true)
    stopTimer()
    const timeCs = Math.floor((Date.now() - startTimeRef.current) / 10)
    sendAnswer(answerText, timeCs)
    return { correct: false, correctAnswer: '' }
  }, [paused])

  const handlePlayAgain = () => {
    disconnect()
    setMatch(null)
    setQuestion(null)
    setGameResult(null)
    setRoundResult(null)
    setMyScore(0)
    setOppScore(0)
    setCountdown(3)
    setOppDisconnected(false)
    setError('')
    setPhase('setup')
    if (mountedRef.current) {
      setTimeout(() => {
        if (mountedRef.current) handleStart()
      }, 100)
    }
  }

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      timeRef.current += 1
      setTimeMs(timeRef.current)
    }, 10)
  }

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const handleCancel = () => {
    cancelQueue()
    disconnect()
    setPhase('setup')
  }

  useEffect(() => {
    return () => {
      stopTimer()
      disconnect()
    }
  }, [])


  // ==== RENDER: setup ====
  if (phase === 'setup') {
    return (
      <PageContent width="narrow">
        <PageHeader
          icon={'\u26A1'}
          title="Блиц-дуэль"
          description="Один вопрос на двоих. Кто первый ответит правильно — забирает раунд. Скорость решает!"
          rules={blitzRules}
        />

        <ConfigCard label="Темы" hint="Выберите хотя бы одну категорию">
          <TopicList topics={topicData} selectedIds={selectedIds} onSelectSubtopic={handleSelectSubtopic} onSelectAll={handleSelectAll} />
        </ConfigCard>

        <ConfigCard label="Настройки">
          <Select label="Раунды" options={ROUND_OPTIONS} value={String(roundCount)} onChange={(e) => setRoundCount(parseInt(e.target.value))} />
          <Select label="Время на раунд" options={TIME_OPTIONS} value={String(timePerRound)} onChange={(e) => setTimePerRound(parseInt(e.target.value))} />
        </ConfigCard>

        {powerupTypes.length > 0 && (
          <ConfigCard label="Power-ups" hint="До 2 усилений за дуэль">
            <PowerupSelector types={powerupTypes} selected={selectedPowerupIds} onChange={setSelectedPowerupIds} max={2} />
          </ConfigCard>
        )}

        <SetupActions
          startLabel="Искать соперника"
          onStart={handleStart}
          disabled={selectedIds.length === 0}
          error={error}
          hint="Выберите хотя бы одну тему"
        />
      </PageContent>
    )
  }

  // ==== RENDER: playing ====
  const isPlaying = phase === 'playing' || phase === 'countdown'
  const inGame = isPlaying || phase === 'round-result'

  return (
    <div>
      {/* Scoreboard */}
      {inGame && match && (
        <div className={styles.scoreboard}>
          <div className={styles.player}>
            <span className={styles.playerName}>Вы</span>
            <span className={styles.playerScore}>{myScore}</span>
          </div>
          <div className={styles.vs}>vs</div>
          <div className={styles.player}>
            <span className={styles.playerName}>{match.opponent.nickname}</span>
            <span className={styles.playerScore}>{oppScore}</span>
          </div>
        </div>
      )}

      {/* Countdown */}
      {phase === 'countdown' && (
        <div className={styles.center}>
          <div className={styles.countdownNumber}>{countdown || 'GO'}</div>
          <Text size="lg" center>Соперник найден! Приготовьтесь...</Text>
        </div>
      )}

      {/* Question */}
      {inGame && question && (
        <>
          <div className={styles.questionText}>{question.text}</div>

          <AnswerGrid
            key={`${roundNumber}`}
            answers={question.answers}
            onAnswer={paused || oppDisconnected ? undefined : handleAnswer}
            dimmedIndices={[]}
          />

          {opponentAnswered && !paused && (
            <div className={styles.opponentAnswered}>Соперник ответил</div>
          )}

          {oppDisconnected && (
            <div className={styles.opponentLeft}>Соперник отключился</div>
          )}

          {/* Timer */}
          {phase === 'playing' && (
            <div className={styles.timerRow}>
              <Timer total={timePerRound * 100} value={timeMs} />
            </div>
          )}
        </>
      )}

      {/* Round Result */}
      {phase === 'round-result' && roundResult && (
        <div className={styles.roundResult}>
          {roundResult.winnerId === null ? (
            <div className={styles.drawBanner}>Ничья в раунде</div>
          ) : roundResult.yourCorrect ? (
            <div className={styles.winBanner}>Вы выиграли раунд!</div>
          ) : (
            <div className={styles.loseBanner}>Раунд проигран</div>
          )}

          <div className={styles.roundDetails}>
            <div className={styles.answerCol}>
              <span className={styles.answerLabel}>Ваш ответ</span>
              <span className={`${styles.answerText} ${roundResult.yourCorrect ? styles.correct : styles.wrong}`}>
                {roundResult.yourAnswer || '—'}
              </span>
              {roundResult.yourTimeCs != null && <span className={styles.answerTime}>{(roundResult.yourTimeCs / 100).toFixed(1)}с</span>}
            </div>
            <div className={styles.answerCol}>
              <span className={styles.answerLabel}>Ответ соперника</span>
              <span className={`${styles.answerText} ${roundResult.opponentCorrect ? styles.correct : styles.wrong}`}>
                {roundResult.opponentAnswer || '—'}
              </span>
              {roundResult.opponentTimeCs != null && <span className={styles.answerTime}>{(roundResult.opponentTimeCs / 100).toFixed(1)}с</span>}
            </div>
          </div>
          <div className={styles.correctAnswer}>Правильный ответ: {roundResult.correctAnswer}</div>
        </div>
      )}

      {/* Powerup bar */}
      {inGame && powerupTypes.length > 0 && (
        <PowerupBar
          available={powerupTypes}
          active={activePowerups}
          gameMode="blitz"
          onActivate={(id) => {
            setActivePowerups((prev) => [...prev, { type: id, applied: true }])
            usePowerup(id)
          }}
        />
      )}

      {/* Cancel */}
      {phase === 'waiting' && (
        <div className={styles.center}>
          <Text size="lg">Поиск соперника...</Text>
          <Button variant="ghost" onClick={handleCancel}>Отмена</Button>
        </div>
      )}

      {/* Error */}
      {error && <Text variant="error" center as="div" style={{ marginTop: 12 }}>{error}</Text>}

      {/* Game Results */}
      {phase === 'results' && gameResult && (
        <div className={styles.finalResults}>
          <h2 className={styles.resultTitle}>
            {gameResult.winnerId === null
              ? 'Ничья!'
              : gameResult.winnerId === match?.opponent.id
                ? 'Вы проиграли!'
                : 'Вы победили!'}
          </h2>
          <div className={styles.finalScores}>
            <span>{gameResult.yourScore} — {gameResult.opponentScore}</span>
          </div>
          <div className={styles.eloChange}>
            Рейтинг: {gameResult.yourEloChange >= 0 ? '+' : ''}{gameResult.yourEloChange} → {gameResult.yourNewRating}
          </div>

          <h3 className={styles.roundsTitle}>Раунды</h3>
          {gameResult.rounds.map((r, i) => (
            <div key={i} className={styles.roundHistory}>
              <div className={styles.roundQ}>{r.roundNumber}. {r.questionText}</div>
              <div className={styles.roundAnswers}>
                <span className={`${styles.roundAnswer} ${r.yourCorrect ? styles.correct : (r.yourCorrect === false ? styles.wrong : '')}`}>
                  Вы: {r.yourAnswer || '—'}
                </span>
                <span className={`${styles.roundAnswer} ${r.opponentCorrect ? styles.correct : (r.opponentCorrect === false ? styles.wrong : '')}`}>
                  Соперник: {r.opponentAnswer || '—'}
                </span>
              </div>
            </div>
          ))}

          <Button variant="primary" size="sm" onClick={handlePlayAgain}>Играть снова</Button>
        </div>
      )}
    </div>
  )
}
