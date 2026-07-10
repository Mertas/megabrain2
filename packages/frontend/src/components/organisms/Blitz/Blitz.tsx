import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Button } from '../../atoms/Button/Button'
import { Select } from '../../atoms/Select/Select'
import { Timer } from '../../molecules/Timer/Timer'
import { AnswerGrid, type AnswerCheckResult } from '../../molecules/AnswerGrid/AnswerGrid'
import { TopicList } from '../TopicList/TopicList'
import { Hero } from '../../molecules/Hero/Hero'
import { Rules } from '../../molecules/Rules/Rules'
import { ConfigCard } from '../../molecules/ConfigCard/ConfigCard'
import { PowerupSelector } from '../../molecules/PowerupSelector/PowerupSelector'
import { Text } from '../../atoms/Text/Text'
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
  { icon: '\u{1F3C6}', text: `Best of ${ROUND_OPTIONS[0].value === '5' ? '5, 7 или 9' : 'N'}: побеждает первый, выигравший больше половины раундов` },
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

  // Match state
  const [match, setMatch] = useState<BlitzMatchFound | null>(null)
  const [question, setQuestion] = useState<{ text: string; answers: string[]; note?: string | null } | null>(null)
  const [roundNumber, setRoundNumber] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [oppScore, setOppScore] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const [opponentAnswered, setOpponentAnswered] = useState(false)
  const [roundResult, setRoundResult] = useState<BlitzRoundResult | null>(null)
  const [gameResult, setGameResult] = useState<BlitzGameResult | null>(null)
  const [timeMs, setTimeMs] = useState(0)
  const [paused, setPaused] = useState(false)

  // Powerup state
  const [powerupTypes, setPowerupTypes] = useState<PowerupType[]>([])
  const [selectedPowerupIds, setSelectedPowerupIds] = useState<string[]>([])
  const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([])

  const timeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  const topicData: Topic[] = useMemo(() => categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    subtopics: cat.topics.map((t) => ({ id: t.id, name: t.name })),
  })), [categories])

  const handleStart = () => {
    if (selectedIds.length === 0) {
      setError('Выберите хотя бы одну тему')
      return
    }
    setError('')
    try {
      connect(token)
      const sock = getSocket()
      if (!sock) { setError('Ошибка подключения'); return }

      sock.on('blitz:waiting', () => setPhase('waiting'))
      sock.on('blitz:cancelled', () => { setPhase('setup'); disconnect() })
      sock.on('blitz:error', (data: { message: string }) => setError(data.message))

      sock.on('blitz:match-found', (data: BlitzMatchFound) => {
        setMatch(data)
        setMyScore(0)
        setOppScore(0)
      })

      sock.on('blitz:countdown', (data: { seconds: number }) => {
        setPhase('countdown')
        setCountdown(data.seconds)
      })

      sock.on('blitz:round-start', (data: { roundNumber: number; question: { text: string; answers: string[]; note?: string | null }; scores: { p1: number; p2: number } }) => {
        setPhase('playing')
        setRoundNumber(data.roundNumber)
        setQuestion(data.question)
        setOpponentAnswered(false)
        setRoundResult(null)
        setPaused(false)
        timeRef.current = 0
        startTimeRef.current = Date.now()
        startTimer()
      })

      sock.on('blitz:opponent-answered', () => setOpponentAnswered(true))

      sock.on('blitz:round-result', (data: BlitzRoundResult) => {
        stopTimer()
        setPaused(true)
        setPhase('round-result')
        setRoundResult(data)
        setMyScore(data.scores.p1)
        setOppScore(data.scores.p2)
      })

      sock.on('blitz:game-result', (data: BlitzGameResult) => {
        setPhase('results')
        setGameResult(data)
      })

      sock.on('blitz:opponent-disconnected', () => setError('Соперник отключился'))

      sock.on('blitz:powerup-opponent', (data: { powerupId: string; effect: string }) => {
        if (data.powerupId === 'freeze') {
          timeRef.current = Math.min(timeRef.current + 300, timePerRound * 100)
        }
      })

      joinQueue(selectedIds, roundCount, timePerRound, selectedPowerupIds)
    } catch {
      setError('Не удалось подключиться к серверу')
    }
  }

  const handleCancel = () => {
    cancelQueue()
    disconnect()
    setPhase('setup')
  }

  const handleAnswer = useCallback(async (answerText: string): Promise<AnswerCheckResult> => {
    if (paused) return { correct: false, correctAnswer: '' }
    setPaused(true)
    stopTimer()
    const timeCs = Math.floor((Date.now() - startTimeRef.current) / 10)
    sendAnswer(answerText, timeCs)
    // The real result comes via socket event blitz:round-result
    return { correct: false, correctAnswer: '' }
  }, [paused])

  const handlePlayAgain = () => {
    disconnect()
    setPhase('setup')
    setMatch(null)
    setQuestion(null)
    setGameResult(null)
    setRoundResult(null)
    setMyScore(0)
    setOppScore(0)
    setCountdown(3)
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

  useEffect(() => {
    return () => { disconnect(); stopTimer() }
  }, [])

  // Load powerup types
  useEffect(() => {
    fetchPowerupInventory().then(async (inv) => {
      const pvpIds = new Set(['freeze', 'shield', 'double-points', 'extra-time', 'peek'])
      const invIds = inv.inventory.filter((i) => i.quantity > 0 && pvpIds.has(i.powerupId)).map((i) => i.powerupId)
      const response = await fetch('/api/powerups/types')
      const allTypes: PowerupType[] = await response.json()
      setPowerupTypes(allTypes.filter((t) => invIds.includes(t.id)))
    }).catch(() => {})
  }, [])

  const selectAll = (topicId: number) => {
    const t = topicData.find((x) => x.id === topicId)!
    const ids = t.subtopics.map((s) => s.id)
    const allSelected = ids.every((id) => selectedIds.includes(id))
    setSelectedIds((prev) => allSelected ? prev.filter((x) => !ids.includes(x)) : [...new Set([...prev, ...ids])])
  }

  if (phase === 'waiting') {
    return (
      <div className={styles.wrap}>
        <div className={styles.waiting}>
          <div className={styles.spinner} />
          <Text as="h2" variant="body">Поиск соперника...</Text>
          <p>{roundCount === 5 ? 'До 3 побед' : roundCount === 7 ? 'До 4 побед' : 'До 5 побед'} • {timePerRound} сек на раунд</p>
          <Button variant="ghost" size="sm" onClick={handleCancel}>Отмена</Button>
        </div>
      </div>
    )
  }

  if (phase === 'countdown') {
    return (
      <div className={styles.wrap}>
        <div className={styles.countdown}>
          <div className={styles.countdownVs}>
            <span>Вы</span>
            <span className={styles.vs}>vs</span>
            <span>{match?.opponent.nickname}</span>
          </div>
          <div className={styles.countdownNum}>{countdown}</div>
        </div>
      </div>
    )
  }

  if (phase === 'playing' && question) {
    return (
      <div className={styles.wrap}>
        <div className={styles.topBar}>
          <div className={styles.scoreBox}>
            <span>Вы: {myScore}</span>
            <span className={styles.oppLabel}>{match?.opponent.nickname}: {oppScore}</span>
          </div>
          <div className={styles.roundInfo}>
            Раунд {roundNumber} • {timePerRound} сек
          </div>
        </div>

        <div className={styles.timerRow}>
          <Timer elapsedCentiseconds={timeMs} />
        </div>

        {opponentAnswered && <div className={styles.oppStatus}>Соперник ответил</div>}

        <div className={styles.questionText}>{question.text}</div>

        <AnswerGrid
          key={`r${roundNumber}`}
          answers={question.answers}
          onAnswer={paused ? undefined : handleAnswer}
        />

        {question.note && (
          <div className={styles.note}>{question.note}</div>
        )}

        {selectedPowerupIds.length > 0 && powerupTypes.length > 0 && (
          <PowerupBar
            available={powerupTypes.filter((t) => selectedPowerupIds.includes(t.id))}
            active={activePowerups}
            gameMode="blitz"
            onActivate={(id) => {
              setActivePowerups((prev) => [...prev, { type: id, applied: true }])
              usePowerup(id)
            }}
          />
        )}
      </div>
    )
  }

  if (phase === 'round-result' && roundResult && question) {
    const myAnswer = roundResult.p1.answer
    const myCorrect = roundResult.p1.correct
    const oppAnswer = roundResult.p2.answer
    const oppCorrect = roundResult.p2.correct
    const iWon = roundResult.winnerId != null // We don't know our id, but if there's a winner it's one of us
    const isDraw = roundResult.winnerId == null

    return (
      <div className={styles.wrap}>
        <div className={styles.roundEndBanner}>
          {isDraw ? (
            <div className={styles.drawBanner}>Ничья в раунде</div>
          ) : iWon ? (
            <div className={styles.winBanner}>Раунд завершён!</div>
          ) : (
            <div className={styles.loseBanner}>Раунд завершён!</div>
          )}
        </div>

        <div className={styles.roundDetails}>
          <div className={styles.playerRow}>
            <span>Ваш ответ: {myAnswer ?? '—'}</span>
            <span className={myCorrect ? styles.green : styles.red}>{myCorrect === true ? '✓' : myCorrect === false ? '✗' : ''}</span>
          </div>
          <div className={styles.playerRow}>
            <span>{match?.opponent.nickname}: {oppAnswer ?? '—'}</span>
            <span className={oppCorrect ? styles.green : styles.red}>{oppCorrect === true ? '✓' : oppCorrect === false ? '✗' : ''}</span>
          </div>
          <div className={styles.correctRow}>
            Правильный ответ: <strong>{roundResult.correctAnswer}</strong>
          </div>
        </div>

        <div className={styles.scoreBoard}>
          Вы {myScore} : {oppScore} {match?.opponent.nickname}
        </div>
      </div>
    )
  }

  if (phase === 'results' && gameResult) {
    const won = gameResult.yourScore > gameResult.opponentScore
    const lost = gameResult.yourScore < gameResult.opponentScore

    return (
      <div className={styles.wrap}>
        <div className={styles.resultBanner}>
          {won && <div className={styles.winBanner}>🏆 Победа!</div>}
          {lost && <div className={styles.loseBanner}>Поражение</div>}
          {!won && !lost && <div className={styles.drawBanner}>Ничья</div>}
        </div>

        <div className={styles.resultScore}>
          {gameResult.yourScore} : {gameResult.opponentScore}
          <div className={`${styles.eloChange} ${gameResult.yourEloChange >= 0 ? styles.eloUp : styles.eloDown}`}>
            Рейтинг: {gameResult.yourNewRating} ({gameResult.yourEloChange >= 0 ? '+' : ''}{gameResult.yourEloChange})
          </div>
          <div className={styles.oppElo}>{match?.opponent.nickname}: {gameResult.opponent.newRating}</div>
        </div>

        <div className={styles.roundsSummary}>
          {gameResult.rounds.map((r) => (
            <div key={r.roundNumber} className={styles.roundSummaryRow}>
              <span>Раунд {r.roundNumber}</span>
              <span className={r.yourCorrect ? styles.green : r.yourCorrect === false ? styles.red : ''}>
                {r.yourCorrect ? '✓' : r.yourCorrect === false ? '✗' : '—'}
              </span>
              <span>{r.correctAnswer}</span>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <Button variant="primary" size="sm" onClick={handlePlayAgain}>Играть снова</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <Hero icon={'\u26A1'} title="Блиц-дуэль" description={`Один вопрос на двоих. Кто первый ответит правильно — забирает раунд. Best of ${roundCount === 5 ? '5' : roundCount === 7 ? '7' : '9'}. Скорость решает!`}       />

      <Rules items={blitzRules} />

      <TopicList
        topics={topicData}
        selectedIds={selectedIds}
        onSelectSubtopic={(id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
        onSelectAll={selectAll}
      />

      <ConfigCard>
        <div className={styles.configRow}>
          <Select label="Формат" hint="До скольких побед играем. 3 победы — быстрый матч, 5 — полноценная дуэль." options={ROUND_OPTIONS} value={String(roundCount)} onChange={(e) => setRoundCount(parseInt(e.target.value))} />
          <Select label="Время на раунд" hint="Секунд на каждый раунд. 10 — молниеносно, 20 — с запасом на раздумья." options={TIME_OPTIONS} value={String(timePerRound)} onChange={(e) => setTimePerRound(parseInt(e.target.value))} />
        </div>
      </ConfigCard>

      {powerupTypes.length > 0 && (
        <PowerupSelector types={powerupTypes} selected={selectedPowerupIds} onChange={setSelectedPowerupIds} />
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button variant="primary" size="lg" onClick={handleStart} disabled={selectedIds.length === 0}>Искать соперника</Button>
        <Button variant="link" size="sm" onClick={() => window.location.href = '/ratings'}>
          {'\u{1F3C6}'} Таблица лидеров
        </Button>
      </div>
    </div>
  )
}
