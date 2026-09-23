import { useState, useEffect, useRef, useCallback } from 'react'
import { Timer } from '../../molecules/Timer/Timer'
import { AnswerGrid, type AnswerCheckResult } from '../../molecules/AnswerGrid/AnswerGrid'
import { GameQuitConfirm } from '../../molecules/GameQuitConfirm/GameQuitConfirm'
import { PowerupBar, type ActivePowerup } from '../../molecules/PowerupBar/PowerupBar'
import { Button } from '../../atoms/Button/Button'
import { Text } from '../../atoms/Text/Text'
import { checkAnswer, flagQuestion } from '../../../lib/api'
import { calcScore } from '../../../lib/score'
import type { PowerupType } from '../../../lib/api'
import styles from './GameBoard.module.scss'

export interface Question {
  id: number
  text: string
  imageUrl?: string
  answers: string[]
  note?: string
}

export interface QuestionResult {
  question: Question
  selectedIndex: number | null
  correctIndex: number
  timeElapsedCs: number
}

export interface GameResult {
  total: number
  correct: number
  timeCs: number
  questions: QuestionResult[]
}

export interface GameBoardProps {
  questions: Question[]
  timeMode: 'per_question' | 'per_game'
  timeSeconds: number
  isAdmin?: boolean
  powerups?: PowerupType[]
  onFinish: (result: GameResult) => void
}

function plural(n: number, forms: [string, string, string]) {
  const m10 = n % 10
  const m100 = n % 100
  if (m100 >= 11 && m100 <= 19) return forms[2]
  if (m10 === 1) return forms[0]
  if (m10 >= 2 && m10 <= 4) return forms[1]
  return forms[2]
}

export function GameBoard({ questions, timeMode, timeSeconds, isAdmin = false, powerups, onFinish }: GameBoardProps) {
  const [idx, setIdx] = useState(0)
  const correctCountRef = useRef(0)
  const totalCsRef = useRef(0)
  const questionStartCsRef = useRef(0)
  const [totalCs, setTotalCs] = useState(0)
  const [paused, setPaused] = useState(false)
  const [quitVisible, setQuitVisible] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [lastCorrect, setLastCorrect] = useState(false)
  const [lastTimeCs, setLastTimeCs] = useState(0)
  const [adminScore, setAdminScore] = useState(0)
  const resultsRef = useRef<QuestionResult[]>([])
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Powerup state
  const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([])
  const [hiddenIndices, setHiddenIndices] = useState<number[]>([])
  const [timeBonus, setTimeBonus] = useState(0)
  const [pointsMultiplier, setPointsMultiplier] = useState(1)
  const [shieldActive, setShieldActive] = useState(false)
  const [secondChanceActive, setSecondChanceActive] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const secondChanceRef = useRef(false)
  const [peekAnswer, setPeekAnswer] = useState<string | null>(null)
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set())

  const question = questions[idx]
  const timeLimitCs = timeSeconds * 100

  const finishGame = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    onFinish({
      total: questions.length,
      correct: correctCountRef.current,
      timeCs: totalCsRef.current,
      questions: [...resultsRef.current],
    })
  }, [questions.length, onFinish])

  const advance = useCallback(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    if (idx + 1 >= questions.length) {
      finishGame()
    } else {
      questionStartCsRef.current = totalCsRef.current
      setIdx((i) => i + 1)
      setPaused(false)
      setTimeUp(false)
      setHiddenIndices([])
      setTimeBonus(0)
      setPeekAnswer(null)
    }
  }, [idx, questions.length, finishGame])

  const handleActivatePowerup = useCallback(async (powerupId: string, _pu: PowerupType) => {
    setActivePowerups((prev) => [...prev, { type: powerupId, applied: true }])

    if (powerupId === 'fifty-fifty' && question) {
      // Find correct answer from server, then hide 2 wrong ones
      const result = await checkAnswer(question.id, question.answers[0], 0, timeSeconds)
      const correctIdx = question.answers.indexOf(result.correctAnswer)
      const wrongIndices = question.answers
        .map((_, i) => i)
        .filter((i) => i !== correctIdx)
      const toHide = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2)
      setHiddenIndices(toHide)
    } else if (powerupId === 'extra-time') {
      setTimeBonus((b) => b + 1000)
    } else if (powerupId === 'double-points') {
      setPointsMultiplier((m) => Math.min(m * 2, 4))
    } else if (powerupId === 'shield') {
      setShieldActive(true)
    } else if (powerupId === 'second-chance') {
      setSecondChanceActive(true)
      secondChanceRef.current = true
    } else if (powerupId === 'peek' && question) {
      setPaused(true)
      const result = await checkAnswer(question.id, question.answers[0], 0, timeSeconds)
      setPeekAnswer(result.correctAnswer)
      resultsRef.current.push({ question, selectedIndex: null, correctIndex: question.answers.indexOf(result.correctAnswer), timeElapsedCs: 0 })
      advanceTimerRef.current = setTimeout(advance, 3000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, timeSeconds, advance])

  const questionElapsed = totalCs - questionStartCsRef.current
  const remainingCs = timeLimitCs - questionElapsed

  // Timer tick
  useEffect(() => {
    if (paused || !question) return
    const id = setInterval(() => {
      totalCsRef.current += 1
      setTotalCs(totalCsRef.current)
    }, 10)
    return () => clearInterval(id)
  }, [paused, question])

  // Enforce per-question time limit
  useEffect(() => {
    if (timeMode !== 'per_question' || timeSeconds <= 0 || paused || !question) return

    const elapsed = totalCs - questionStartCsRef.current
    const remaining = timeLimitCs - elapsed
    if (remaining <= 0) {
      setPaused(true)
      setTimeUp(true)
      return
    }

    const delay = remaining * 10
    const id = setTimeout(() => {
      setPaused(true)
      setTimeUp(true)
    }, delay)
    return () => clearTimeout(id)
  }, [timeMode, timeSeconds, timeLimitCs, paused, question, totalCs, idx])

  // Enforce per-game time limit
  useEffect(() => {
    if (timeMode !== 'per_game' || timeSeconds <= 0) return

    const remaining = timeLimitCs - totalCs
    if (remaining <= 0) {
      setPaused(true)
      setTimeUp(true)
      return
    }

    const delay = remaining * 10
    const id = setTimeout(() => {
      setPaused(true)
      setTimeUp(true)
    }, delay)
    return () => clearTimeout(id)
  }, [timeMode, timeSeconds, timeLimitCs, totalCs])

  // Auto-advance after time up
  useEffect(() => {
    if (!timeUp) return
    if (timeMode === 'per_game') {
      finishGame()
      return
    }
    advanceTimerRef.current = setTimeout(advance, 2500)
    return () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current) }
  }, [timeUp, timeMode, advance, finishGame])

  const handleAnswer = useCallback(async (answerText: string): Promise<AnswerCheckResult> => {
    setPaused(true)
    const answerTimeCs = totalCsRef.current - questionStartCsRef.current
    const result = await checkAnswer(question.id, answerText, answerTimeCs, timeSeconds)

    let effectiveCorrect = result.correct
    if (!effectiveCorrect && shieldActive) {
      effectiveCorrect = true
      setShieldActive(false)
    }

    setLastCorrect(effectiveCorrect)
    setLastTimeCs(answerTimeCs)

    if (effectiveCorrect) correctCountRef.current++

    // Second-chance: if wrong and powerup active, retry instead of advancing
    if (!effectiveCorrect && secondChanceRef.current) {
      secondChanceRef.current = false
      setSecondChanceActive(false)
      setShieldActive(false)
      // Show wrong answer briefly, then remount AnswerGrid for retry
      advanceTimerRef.current = setTimeout(() => {
        setRetryKey((k) => k + 1)
        setPaused(false)
      }, 1500)
      return { correct: false, correctAnswer: '' }
    }

    const answers = question.answers
    const selectedIndex = answers.indexOf(answerText)
    const correctIndex = answers.indexOf(result.correctAnswer)
    resultsRef.current.push({ question, selectedIndex, correctIndex: correctIndex >= 0 ? correctIndex : 0, timeElapsedCs: answerTimeCs })

    if (isAdmin) {
      const basePoints = calcScore(answerTimeCs, timeMode, timeSeconds, questions.length, effectiveCorrect)
      const points = Math.round(basePoints * pointsMultiplier * 100) / 100
      setAdminScore((s) => Math.round((s + points) * 100) / 100)
    }

    if (pointsMultiplier > 1) setPointsMultiplier(1)

    advanceTimerRef.current = setTimeout(advance, 2500)
    return { correct: effectiveCorrect, correctAnswer: result.correctAnswer }
  }, [question, timeMode, timeSeconds, questions.length, isAdmin, advance, shieldActive, pointsMultiplier])

  const handleSkip = () => {
    const timeAtSkip = totalCsRef.current - questionStartCsRef.current
    resultsRef.current.push({ question, selectedIndex: null, correctIndex: 0, timeElapsedCs: timeAtSkip })
    advance()
  }

  const handleQuit = () => {
    finishGame()
  }

  // Keyboard: Z, X, C for powerups
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!powerups || paused) return
      const key = e.key.toLowerCase()
      const index = { z: 0, x: 1, c: 2 }[key]
      if (index !== undefined && powerups[index]) {
        const pu = powerups[index]
        const alreadyUsed = activePowerups.some((a) => a.type === pu.id)
        if (!alreadyUsed) {
          handleActivatePowerup(pu.id, pu)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [powerups, paused, activePowerups, handleActivatePowerup])

  if (!question) {
    return (
      <div>
        <Text as="h1" variant="heading">Нет вопросов</Text>
        <p>Выберите темы и начните игру.</p>
      </div>
    )
  }

  const timeLimitActive = timeSeconds > 0
  const displayCs = timeMode === 'per_question' && timeLimitActive
    ? Math.max(0, remainingCs + timeBonus)
    : timeLimitActive
      ? Math.max(0, timeLimitCs - totalCs + timeBonus)
      : totalCs

  const lastPoints = paused && isAdmin
    ? calcScore(lastTimeCs, timeMode, timeSeconds, questions.length, lastCorrect)
    : 0

  return (
    <div>
      <div className={styles.quitRow}>
        <GameQuitConfirm
          visible={quitVisible}
          onRequestConfirm={() => setQuitVisible(true)}
          onConfirm={handleQuit}
          onCancel={() => setQuitVisible(false)}
        />
      </div>

      <div className={styles.timerRow}>
        <Timer elapsedCentiseconds={displayCs} />
      </div>

      <div className={styles.progress}>
        {correctCountRef.current} {plural(correctCountRef.current, ['ответ', 'ответа', 'ответов'])} из {idx + 1}
        {timeUp && <span className={styles.timeUp}>время вышло</span>}
        {isAdmin && <span className={styles.adminIndicator}>счёт: {adminScore}</span>}
      </div>

      {question.imageUrl && (
        <div className={styles.image}>
          <img src={question.imageUrl} alt="" />
        </div>
      )}
      <div className={styles.question}>
        {question.text}
        {!paused && (
          <button
            type="button"
            className={`${styles.flagBtn} ${flaggedIds.has(question.id) ? styles.flagged : ''}`}
            title={flaggedIds.has(question.id) ? 'Вопрос отмечен как плохой' : 'Отметить как плохой вопрос'}
            onClick={async (e) => {
              e.stopPropagation()
              try {
                await flagQuestion(question.id)
                setFlaggedIds((prev) => {
                  const next = new Set(prev)
                  if (next.has(question.id)) next.delete(question.id); else next.add(question.id)
                  return next
                })
              } catch { /* ignore */ }
            }}
          >
            {flaggedIds.has(question.id) ? '\u{1F6A9}' : '\u{1F6A9}'}
          </button>
        )}
      </div>

      <AnswerGrid
        key={`${idx}-${retryKey}`}
        answers={question?.answers || []}
        dimmedIndices={hiddenIndices}
        onAnswer={paused ? undefined : handleAnswer}
      />

      {paused && (
        <>
          {question.note && (
            <div className={styles.note}>{question.note}</div>
          )}
          {hiddenIndices.length > 0 && (
            <div className={styles.powerupFeedback}>
              🎯 50:50 активирован — 2 неверных ответа затемнены
            </div>
          )}
          {pointsMultiplier > 1 && (
            <div className={styles.powerupFeedback}>
              ✨ ×{pointsMultiplier} очков активно
            </div>
          )}
          {shieldActive && (
            <div className={`${styles.powerupFeedback} ${styles.powerupGreen}`}>
              🛡 Щит активен — следующая ошибка не засчитается
            </div>
          )}
          {secondChanceActive && (
            <div className={styles.powerupFeedback}>
              🔁 Второй шанс активен — можно ошибиться один раз
            </div>
          )}
          {peekAnswer && (
            <div className={`${styles.powerupFeedback} ${styles.powerupGreen}`}>
              👁 Правильный ответ: <strong>{peekAnswer}</strong> (0 очков)
            </div>
          )}
          {isAdmin && (
            <div className={styles.adminScore}>
              вопрос: +{lastPoints} очков | накоплено: {adminScore}
            </div>
          )}
        </>
      )}

      {powerups && powerups.length > 0 && (
        <PowerupBar
          available={powerups}
          active={activePowerups}
          gameMode="solo"
          onActivate={handleActivatePowerup}
        />
      )}

      <div className={styles.skipRow}>
        <Button variant="ghost" size="sm" onClick={handleSkip} disabled={paused}>
          {'\u21BA'} Пропустить
        </Button>
      </div>
    </div>
  )
}
