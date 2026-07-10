import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Button } from '../../atoms/Button/Button'
import { Hero } from '../../molecules/Hero/Hero'
import { Rules } from '../../molecules/Rules/Rules'
import { ConfigCard } from '../../molecules/ConfigCard/ConfigCard'
import { PowerupSelector } from '../../molecules/PowerupSelector/PowerupSelector'
import { Text } from '../../atoms/Text/Text'
import { Spinner } from '../../atoms/Spinner/Spinner'
import { Select } from '../../atoms/Select/Select'
import { Checkbox } from '../../atoms/Checkbox/Checkbox'
import { AnswerGrid, type AnswerCheckResult } from '../../molecules/AnswerGrid/AnswerGrid'
import { Timer } from '../../molecules/Timer/Timer'
import { Table, type TableColumn } from '../../molecules/Table/Table'
import { TopicList } from '../TopicList/TopicList'
import {
  connect, disconnect, joinQueue, cancelQueue, sendAnswer, getSocket, usePowerup,
  type PvPMatchFound, type PvPResult, type PvPQuestion,
} from '../../../lib/pvp-socket'
import {
  fetchCategories, fetchPvPRatings, fetchPowerupInventory,
  type ApiCategory, type PvPRatingEntry, type AdminPageResult, type PowerupType,
} from '../../../lib/api'
import { PowerupBar, type ActivePowerup } from '../../molecules/PowerupBar/PowerupBar'
import styles from './PvP.module.scss'
import { getEloIcon } from '../../../lib/icons'

export interface PvPProps {}

const qtyOptions = [
  { value: '10', label: '10 вопросов (1 тема)' },
  { value: '30', label: '30 вопросов (2 темы)' },
  { value: '50', label: '50 вопросов (3 темы)' },
]

const timeOptions = [
  { value: '15', label: '15 секунд' },
  { value: '30', label: '30 секунд' },
  { value: '60', label: '1 минута' },
  { value: '0', label: 'без ограничений' },
]

const pvpRules = [
  { icon: '\u{1F4CB}', text: 'Общий набор вопросов — оба игрока видят одно и то же одновременно' },
  { icon: '\u23F1', text: 'Очки за скорость: чем быстрее правильный ответ, тем больше очков за вопрос' },
  { icon: '\u{1F3C6}', text: 'ELO-рейтинг: побеждайте, чтобы подниматься в таблице лидеров' },
]

export interface PvPProps {
  // (no props needed — token read from localStorage)
}

export function PvP(_props: PvPProps) {
  const [view, setView] = useState<'lobby' | 'waiting' | 'countdown' | 'playing' | 'results'>('lobby')
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [selectedTopics, setSelectedTopics] = useState<number[]>([])
  const [questionCount, setQuestionCount] = useState('10')
  const [timePerQ, setTimePerQ] = useState('30')
  const [strictTopics, setStrictTopics] = useState(true)
  const [match, setMatch] = useState<PvPMatchFound | null>(null)
  const [result, setResult] = useState<PvPResult | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [opponentAnswers, setOpponentAnswers] = useState<number[]>([])
  const [opponentTotal, setOpponentTotal] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const timerCsRef = useRef(0)
  const qStartRef = useRef(0)
  const [timerCs, setTimerCs] = useState(0)
  const [oppDisconnected, setOppDisconnected] = useState(false)
  const [error, setError] = useState('')
  const socketRef = useRef(getSocket())
  const viewRef = useRef(view)
  viewRef.current = view
  const [powerupTypes, setPowerupTypes] = useState<PowerupType[]>([])
  const [selectedPowerups, setSelectedPowerups] = useState<string[]>([])
  const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([])

  useEffect(() => {
    fetchCategories().then(setCategories)
    fetchPowerupInventory().then(async (inv) => {
      const pvpIds = new Set(['freeze', 'shield', 'double-points', 'extra-time', 'peek'])
      const invIds = inv.inventory.filter((i) => i.quantity > 0 && pvpIds.has(i.powerupId)).map((i) => i.powerupId)
      const response = await fetch('/api/powerups/types')
      const allTypes: PowerupType[] = await response.json()
      setPowerupTypes(allTypes.filter((t) => invIds.includes(t.id)))
    }).catch(() => {})
  }, [])

  const topicsData = useMemo(() => categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    subtopics: cat.topics.map((t) => ({ id: t.id, name: t.name })),
  })), [categories])

  const maxTopics = parseInt(questionCount) === 10 ? 1 : parseInt(questionCount) === 30 ? 2 : 3

  const handleSelectSubtopic = (id: number) => {
    setSelectedTopics((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id)
      if (p.length >= maxTopics) return p
      return [...p, id]
    })
  }

  const handleSelectAll = (topicId: number) => {
    const topic = topicsData.find((t) => t.id === topicId)!
    const ids = topic.subtopics.map((s) => s.id)
    const allSelected = ids.every((id) => selectedTopics.includes(id))
    if (allSelected) {
      setSelectedTopics((prev) => prev.filter((x) => !ids.includes(x)))
    } else {
      const toAdd = ids.filter((id) => !selectedTopics.includes(id)).slice(0, maxTopics - selectedTopics.length)
      if (toAdd.length > 0) setSelectedTopics((prev) => [...prev, ...toAdd])
    }
  }

  const handleJoin = useCallback(() => {
    if (selectedTopics.length < maxTopics) return

    // Read token fresh from localStorage
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setError('Необходимо войти')
      return
    }

    // Clean up any previous connection
    disconnect()

    const s = connect(token)
    socketRef.current = s
    setError('')
    setOppDisconnected(false)
    setResult(null)
    setMatch(null)

    // Remove any lingering listeners then set fresh ones
    s.off('pvp:waiting')
    s.off('pvp:cancelled')
    s.off('pvp:error')
    s.off('pvp:countdown')
    s.off('pvp:match-found')
    s.off('pvp:question')
    s.off('pvp:opponent')
    s.off('pvp:opponent-disconnected')
    s.off('pvp:game-result')
    s.off('pvp:powerup-self')
    s.off('pvp:powerup-opponent')

    s.on('pvp:waiting', () => setView('waiting'))
    s.on('pvp:cancelled', () => { setView('lobby'); disconnect() })
    s.on('pvp:error', (data: { message: string }) => { setError(data.message); setView('lobby') })

    s.on('pvp:powerup-self', (_data: { powerupId: string; effect: string }) => {
      // Powerup activated by us
    })
    s.on('pvp:powerup-opponent', (data: { powerupId: string; effect: string }) => {
      if (data.powerupId === 'freeze') {
        // Opponent used freeze — reduce our timer
        timerCsRef.current = Math.min(timerCsRef.current + 500, parseInt(timePerQ) * 100)
      }
    })

    s.on('pvp:countdown', (data: { seconds: number }) => {
      if (viewRef.current === 'lobby' || viewRef.current === 'waiting') setView('countdown')
      setCountdown(data.seconds)
    })

    s.on('pvp:match-found', (data: PvPMatchFound) => {
      setMatch(data)
      setView('countdown')
      setCountdown(5)
      setQIndex(0)
      setPaused(false)
      setOpponentAnswers([])
      setOpponentTotal(0)
      timerCsRef.current = 0
      setTimerCs(0)
      qStartRef.current = Date.now()
    })

    s.on('pvp:question', (data: { index: number; question: PvPQuestion }) => {
      setView('playing')
      setQIndex(data.index)
      setPaused(false)
      timerCsRef.current = 0
      setTimerCs(0)
      qStartRef.current = Date.now()
    })

    s.on('pvp:opponent', (data: { questionIndex: number }) => {
      setOpponentAnswers((p) => [...p, data.questionIndex])
      setOpponentTotal((t) => t + 1)
    })

    s.on('pvp:opponent-disconnected', () => {
      setOppDisconnected(true)
    })

    s.on('pvp:game-result', (data: PvPResult) => {
      setResult(data)
      setView('results')
    })

    joinQueue(selectedTopics, parseInt(questionCount), parseInt(timePerQ), strictTopics, selectedPowerups)
  }, [selectedTopics, questionCount, timePerQ, strictTopics, maxTopics])

  const handleCancel = () => {
    cancelQueue()
    disconnect()
    setView('lobby')
  }

  const handleAnswer = useCallback(async (answerText: string): Promise<AnswerCheckResult> => {
    if (!match) return { correct: false, correctAnswer: '' }
    setPaused(true)
    const elapsed = Date.now() - qStartRef.current
    const elapsedDs = Math.floor(elapsed / 10)

    const s = socketRef.current
    if (!s) return { correct: false, correctAnswer: '' }

    const serverResult = await new Promise<AnswerCheckResult>((resolve) => {
      const timeout = setTimeout(() => {
        s.off('pvp:answer-result', handler)
        resolve({ correct: false, correctAnswer: '' })
      }, 5000)

      const handler = (data: { correct: boolean; correctAnswer: string; points: number }) => {
        clearTimeout(timeout)
        s.off('pvp:answer-result', handler)
        resolve({ correct: data.correct, correctAnswer: data.correctAnswer })
      }

      s.on('pvp:answer-result', handler)
      sendAnswer(qIndex, answerText, elapsedDs)
    })

    return serverResult
  }, [match, qIndex])

  // Timer
  useEffect(() => {
    if (paused || view !== 'playing') return
    const id = setInterval(() => {
      timerCsRef.current += 1
      setTimerCs(timerCsRef.current)
    }, 10)
    return () => clearInterval(id)
  }, [paused, view])

  const handleBackToLobby = () => {
    disconnect()
    setMatch(null)
    setResult(null)
    setView('lobby')
  }

  if (view === 'waiting') {
    return (
      <div className={styles.center}>
        <Spinner size="lg" />
        <Text as="p" size="lg">Поиск соперника...</Text>
        <Text as="p" variant="muted">
          {strictTopics ? 'Темы совпадают строго' : 'Любые темы'}, количество вопросов и таймаут совпадают
        </Text>
        <Button variant="ghost" onClick={handleCancel}>Отмена</Button>
      </div>
    )
  }

  if (view === 'countdown') {
    return (
      <div className={styles.center}>
        <div className={styles.countdown}>{countdown}</div>
        <Text as="p" variant="muted" size="md">
          {match?.opponent.nickname} найден. Игра начнётся через...
        </Text>
      </div>
    )
  }

  if (view === 'playing' && match) {
    const q = match.questions[qIndex]
    if (!q) {
      return <div className={styles.center}><Spinner size="md" /><p className={styles.waitText}>Загрузка вопроса...</p></div>
    }

    const timeLimitActive = parseInt(timePerQ) > 0
    const displayCs = timeLimitActive ? Math.max(0, parseInt(timePerQ) * 100 - timerCs) : timerCs

    return (
      <div className={styles.wrap}>
        <div className={styles.topBar}>
          <span>Вы: {opponentTotal} отвечено</span>
          <span>{match.opponent.nickname} ({match.opponent.rating}): {opponentAnswers.length} {oppDisconnected && '(откл)'}</span>
        </div>

        <div className={styles.timerRow}>
          <Timer elapsedCentiseconds={displayCs} />
        </div>

        <div className={styles.progress}>
          {qIndex + 1}/{match.questions.length} {q.topicName && `· ${q.topicName}`}
        </div>

        <div className={styles.questionText}>{q.text}</div>

        <AnswerGrid key={qIndex} answers={q.answers} onAnswer={paused ? undefined : handleAnswer} />

        {paused && q.note && (
          <div className={styles.note}>{q.note}</div>
        )}

        {oppDisconnected && (
          <div className={styles.dcWarning}>Соперник отключился. Если не вернётся — вам засчитают победу.</div>
        )}

        {selectedPowerups.length > 0 && powerupTypes.length > 0 && (
          <PowerupBar
            available={powerupTypes.filter((t) => selectedPowerups.includes(t.id))}
            active={activePowerups}
            gameMode="pvp"
            onActivate={(id) => {
              setActivePowerups((prev) => [...prev, { type: id, applied: true }])
              usePowerup(id)
            }}
          />
        )}
      </div>
    )
  }

  if (view === 'results' && result && match) {
    return (
      <div>
        <Text as="h1" variant="heading">Результаты PvP</Text>

        <div className={styles.resultHeader}>
          <div>Вы</div>
          <div>{match.opponent.nickname}</div>
        </div>

        <div className={styles.resultScores}>
          <div className={styles.scoreBlock}>
            <div className={styles.scoreValue}>{result.yourScore}</div>
            <div className={styles.scoreLabel}>очков</div>
            <div className={`${styles.eloChange} ${result.yourEloChange >= 0 ? styles.eloUp : styles.eloDown}`}>
              {result.yourEloChange >= 0 ? '+' : ''}{result.yourEloChange} ELO
            </div>
          </div>
          <div className={styles.scoreVs}>VS</div>
          <div className={styles.scoreBlock}>
            <div className={styles.scoreValue}>{result.opponentScore}</div>
            <div className={styles.scoreLabel}>очков</div>
            <div className={`${styles.eloChange} ${ -result.yourEloChange >= 0 ? styles.eloUp : styles.eloDown}`}>
              {result.yourEloChange >= 0 ? '' : '+'}{-result.yourEloChange} ELO
            </div>
          </div>
        </div>

        <h2 className={styles.bdownTitle}>По вопросам</h2>
        {result.breakdown.map((b, i) => (
          <div key={i} className={styles.breakRow}>
            <span className={styles.qNum}>{i + 1}.</span>
            <span className={`${styles.qMine} ${b.correct ? styles.ok : styles.fail}`}>
              {b.yourAnswer || '—'}
            </span>
            <span className={`${styles.qOpp} ${b.opponentCorrect ? styles.ok : styles.fail}`}>
              {b.opponentAnswer || '—'}
            </span>
            <span className={styles.qPts}>{b.yourPoints}</span>
          </div>
        ))}

        <div className={styles.actions}>
          <Button variant="primary" onClick={handleBackToLobby}>В лобби</Button>
        </div>
      </div>
    )
  }

  // Lobby
  const canJoin = selectedTopics.length === maxTopics

  return (
      <div className={styles.wrap}>
      <Hero icon={'\u2694\uFE0F'} title="PvP" description="Сразитесь с живым соперником. Одинаковые вопросы, одновременные ответы — побеждает самый эрудированный."       />

      <Rules items={pvpRules} />

      <div>
        <div className={styles.topicHint}>Выберите {maxTopics} тем{maxTopics > 1 ? 'ы' : 'у'}</div>
        <TopicList
          topics={topicsData}
          selectedIds={selectedTopics}
          onSelectSubtopic={handleSelectSubtopic}
          onSelectAll={handleSelectAll}
        />

        <ConfigCard>
          <div className={styles.configRow}>
          <div className={styles.configCol}>
            <Select label="Вопросов" hint="10 — короткая разминка. 30 — уже серьёзно. 50 — проверка на выносливость. Всё как в обычной жизни, только про эрудицию." options={qtyOptions} value={questionCount} onChange={(e) => { setQuestionCount(e.target.value); setSelectedTopics([]) }} />
          </div>
          <div className={styles.configCol}>
            <Select label="Таймаут на вопрос" hint="Сколько секунд у вас есть, чтобы вспомнить. Если не знаете — время подскажет, что пора нажимать наугад." options={timeOptions} value={timePerQ} onChange={(e) => setTimePerQ(e.target.value)} />
          </div>
        </div>

        <div className={styles.strictBlock}>
          <Checkbox label="Тема должна совпадать" checked={strictTopics} onChange={(e) => setStrictTopics(e.target.checked)} />
          <div className={styles.strictHint}>Включите, чтобы играть строго по выбранным темам. Выключите — и соперник может принести свои. Вдруг у него интереснее.</div>
        </div>
        </ConfigCard>
      </div>

      {powerupTypes.length > 0 && (
        <PowerupSelector types={powerupTypes} selected={selectedPowerups} onChange={setSelectedPowerups} />
      )}

      <div className={styles.joinAction}>
        <Button variant="primary" size="lg" disabled={!canJoin} onClick={handleJoin}>Искать соперника</Button>
        <Button variant="link" size="sm" onClick={() => window.location.href = '/ratings'}>
          {'\u{1F3C6}'} Таблица лидеров
        </Button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
}

// --------------- Ratings Page ---------------

export function PvPRatings() {
  const [data, setData] = useState<AdminPageResult<PvPRatingEntry> | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await fetchPvPRatings(page)) } catch { setData(null) }
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  const columns: TableColumn<PvPRatingEntry>[] = [
    { key: 'rank', label: '#', width: '40px' },
    { key: 'icon', label: '', width: '30px', render: (r) => <span className={styles.ratingIcon}>{getEloIcon(r.rating)}</span> },
    { key: 'nickname', label: 'Игрок', render: (r) => r.nickname || r.login },
    { key: 'rating', label: 'ELO', width: '70px' },
    { key: 'wins', label: 'Победы', width: '60px' },
    { key: 'losses', label: 'Пораж.', width: '60px' },
    { key: 'draws', label: 'Ничьи', width: '50px' },
  ]

  return (
    <div>
      <h1 className={styles.ratingTitle}>Рейтинг PvP</h1>
      <Table columns={columns} data={data?.items || []} rowKey={(r) => r.userId} loading={loading} />
      {data && data.pages > 1 && (
        <div className={styles.ratingPagination}>
          {Array.from({ length: data.pages }, (_, i) => (
            <Button key={i} variant={page === i + 1 ? 'primary' : 'ghost'} size="sm" onClick={() => setPage(i + 1)}>
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
