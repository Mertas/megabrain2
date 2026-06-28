import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '../../atoms/Button/Button'
import { Spinner } from '../../atoms/Spinner/Spinner'
import { Select } from '../../atoms/Select/Select'
import { Checkbox } from '../../atoms/Checkbox/Checkbox'
import { AnswerGrid, type AnswerCheckResult } from '../../molecules/AnswerGrid/AnswerGrid'
import { Timer } from '../../molecules/Timer/Timer'
import { Table, type TableColumn } from '../../molecules/Table/Table'
import {
  connect, disconnect, joinQueue, cancelQueue, sendAnswer, getSocket,
  type PvPMatchFound, type PvPResult, type PvPQuestion,
} from '../../../lib/pvp-socket'
import {
  fetchCategories, fetchPvPRatings,
  type ApiCategory, type PvPRatingEntry, type AdminPageResult,
} from '../../../lib/api'
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

  useEffect(() => { fetchCategories().then(setCategories) }, [])

  const topicOptions = categories.flatMap((c) =>
    c.topics.map((t) => ({ value: String(t.id), label: `${c.name} → ${t.name}` })),
  )

  const maxTopics = parseInt(questionCount) === 10 ? 1 : parseInt(questionCount) === 30 ? 2 : 3

  const toggleTopic = (id: number) => {
    setSelectedTopics((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id)
      if (p.length >= maxTopics) return p
      return [...p, id]
    })
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

    s.on('pvp:waiting', () => setView('waiting'))
    s.on('pvp:cancelled', () => { setView('lobby'); disconnect() })
    s.on('pvp:error', (data: { message: string }) => { setError(data.message); setView('lobby') })

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

    joinQueue(selectedTopics, parseInt(questionCount), parseInt(timePerQ), strictTopics)
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
        <p style={{ fontSize: 17, marginTop: 20 }}>Поиск соперника...</p>
        <p style={{ fontSize: 12, color: '#666' }}>
          {strictTopics ? 'Темы совпадают строго' : 'Любые темы'}, количество вопросов и таймаут совпадают
        </p>
        <Button variant="ghost" onClick={handleCancel} style={{ marginTop: 16 }}>Отмена</Button>
      </div>
    )
  }

  if (view === 'countdown') {
    return (
      <div className={styles.center}>
        <div className={styles.countdown}>{countdown}</div>
        <p style={{ fontSize: 14, color: '#666', marginTop: 12 }}>
          {match?.opponent.nickname} найден. Игра начнётся через...
        </p>
      </div>
    )
  }

  if (view === 'playing' && match) {
    const q = match.questions[qIndex]
    if (!q) {
      return <div style={{ textAlign: 'center', padding: 60 }}><Spinner size="md" /><p style={{ marginTop: 12 }}>Загрузка вопроса...</p></div>
    }

    const timeLimitActive = parseInt(timePerQ) > 0
    const displayCs = timeLimitActive ? Math.max(0, parseInt(timePerQ) * 100 - timerCs) : timerCs

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 12 }}>
          <span>Вы: {opponentTotal} отвечено</span>
          <span>{match.opponent.nickname} ({match.opponent.rating}): {opponentAnswers.length} {oppDisconnected && '(откл)'}</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Timer elapsedCentiseconds={displayCs} />
        </div>

        <div style={{ fontSize: 17, marginBottom: 12 }}>
          {qIndex + 1}/{match.questions.length} {q.topicName && `· ${q.topicName}`}
        </div>

        <div style={{ fontSize: 17, marginBottom: 12, fontWeight: 'bold' }}>{q.text}</div>

        <AnswerGrid key={qIndex} answers={q.answers} onAnswer={paused ? undefined : handleAnswer} />

        {paused && q.note && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#EDEBD2', borderRadius: 6, fontSize: 13, lineHeight: 1.5, color: '#0E2136', fontStyle: 'italic' }}>
            {q.note}
          </div>
        )}

        {oppDisconnected && (
          <div style={{ marginTop: 12, color: '#FF6633', fontSize: 12 }}>Соперник отключился. Если не вернётся — вам засчитают победу.</div>
        )}
      </div>
    )
  }

  if (view === 'results' && result && match) {
    return (
      <div>
        <h1>Результаты PvP</h1>

        <div className={styles.resultHeader}>
          <div>Вы</div>
          <div>{match.opponent.nickname}</div>
        </div>

        <div className={styles.resultScores}>
          <div className={styles.scoreBlock}>
            <div className={styles.scoreValue}>{result.yourScore}</div>
            <div className={styles.scoreLabel}>очков</div>
            <div className={styles.eloChange} style={{ color: result.yourEloChange >= 0 ? '#37CE74' : '#FF0000' }}>
              {result.yourEloChange >= 0 ? '+' : ''}{result.yourEloChange} ELO
            </div>
          </div>
          <div className={styles.scoreVs}>VS</div>
          <div className={styles.scoreBlock}>
            <div className={styles.scoreValue}>{result.opponentScore}</div>
            <div className={styles.scoreLabel}>очков</div>
            <div className={styles.eloChange} style={{ color: -result.yourEloChange >= 0 ? '#37CE74' : '#FF0000' }}>
              {result.yourEloChange >= 0 ? '' : '+'}{-result.yourEloChange} ELO
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 17, marginTop: 24, marginBottom: 12 }}>По вопросам</h2>
        {result.breakdown.map((b, i) => (
          <div key={i} className={styles.breakRow}>
            <span className={styles.qNum}>{i + 1}.</span>
            <span className={styles.qMine} style={{ color: b.correct ? '#37CE74' : '#FF0000' }}>
              {b.yourAnswer || '—'}
            </span>
            <span className={styles.qOpp} style={{ color: b.opponentCorrect ? '#37CE74' : '#FF0000' }}>
              {b.opponentAnswer || '—'}
            </span>
            <span className={styles.qPts}>{b.yourPoints}</span>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
          <Button variant="primary" onClick={handleBackToLobby}>В лобби</Button>
        </div>
      </div>
    )
  }

  // Lobby
  const canJoin = selectedTopics.length === maxTopics

  return (
    <div>
      <h1>PvP</h1>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Выберите {maxTopics} тем{maxTopics > 1 ? 'ы' : 'у'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {topicOptions.map((opt) => {
            const selected = selectedTopics.includes(Number(opt.value))
            const disabled = !selected && selectedTopics.length >= maxTopics
            return (
              <Button
                key={opt.value}
                variant={selected ? 'primary' : 'ghost'}
                size="sm"
                disabled={disabled}
                onClick={() => toggleTopic(Number(opt.value))}
              >
                {opt.label}
              </Button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <Select label="Вопросов" hint="10 — короткая разминка. 30 — уже серьёзно. 50 — проверка на выносливость. Всё как в обычной жизни, только про эрудицию." options={qtyOptions} value={questionCount} onChange={(e) => { setQuestionCount(e.target.value); setSelectedTopics([]) }} />
          </div>
          <div style={{ flex: 1 }}>
            <Select label="Таймаут на вопрос" hint="Сколько секунд у вас есть, чтобы вспомнить. Если не знаете — время подскажет, что пора нажимать наугад." options={timeOptions} value={timePerQ} onChange={(e) => setTimePerQ(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <Checkbox label="Тема должна совпадать" checked={strictTopics} onChange={(e) => setStrictTopics(e.target.checked)} />
          <div style={{ fontSize: 10, color: '#999', marginTop: 4, lineHeight: 1.4 }}>Включите, чтобы играть строго по выбранным темам. Выключите — и соперник может принести свои. Вдруг у него интереснее.</div>
        </div>
      </div>

      <Button variant="primary" size="lg" fullWidth disabled={!canJoin} onClick={handleJoin}>
        Искать соперника
      </Button>
      {error && (
        <div style={{ marginTop: 12, padding: 8, borderRadius: 4, fontSize: 12, color: '#FF0000', border: '1px solid #FF0000', background: 'rgba(255,0,0,0.05)' }}>
          {error}
        </div>
      )}
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
    { key: 'icon', label: '', width: '30px', render: (r) => <span style={{ fontSize: 20 }}>{getEloIcon(r.rating)}</span> },
    { key: 'nickname', label: 'Игрок', render: (r) => r.nickname || r.login },
    { key: 'rating', label: 'ELO', width: '70px' },
    { key: 'wins', label: 'Победы', width: '60px' },
    { key: 'losses', label: 'Пораж.', width: '60px' },
    { key: 'draws', label: 'Ничьи', width: '50px' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Рейтинг</h1>
      <Table columns={columns} data={data?.items || []} rowKey={(r) => r.userId} loading={loading} />
      {data && data.pages > 1 && (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 16 }}>
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
