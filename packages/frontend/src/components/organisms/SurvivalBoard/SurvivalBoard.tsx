import { useState, useEffect, useRef, useCallback } from 'react'
import { Timer } from '../../molecules/Timer/Timer'
import { AnswerGrid, type AnswerCheckResult } from '../../molecules/AnswerGrid/AnswerGrid'
import { GameQuitConfirm } from '../../molecules/GameQuitConfirm/GameQuitConfirm'
import { PowerupBar, type ActivePowerup } from '../../molecules/PowerupBar/PowerupBar'
import { Button } from '../../atoms/Button/Button'
import { Text } from '../../atoms/Text/Text'
import { answerSurvival, finishSurvival, checkAnswer, flagQuestion, type SurvivalQuestion, type SurvivalSummary, type PowerupType } from '../../../lib/api'
import styles from './SurvivalBoard.module.scss'

export interface SurvivalBoardProps {
  sessionId: string
  initialQuestion: SurvivalQuestion
  initialTimeLimit: number
  initialLives: number
  initialStreak: number
  initialScore: number
  initialDifficulty: string
  powerups?: PowerupType[]
  onFinish: (summary: SurvivalSummary) => void
}

export function SurvivalBoard({
  sessionId,
  initialQuestion,
  initialTimeLimit,
  initialLives,
  initialStreak,
  initialScore,
  initialDifficulty,
  powerups,
  onFinish,
}: SurvivalBoardProps) {
  const [question, setQuestion] = useState<SurvivalQuestion>(initialQuestion)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(initialTimeLimit)
  const [timeLimitCs, setTimeLimitCs] = useState(initialTimeLimit * 100)
  const [lives, setLives] = useState(initialLives)
  const [streak, setStreak] = useState(initialStreak)
  const [score, setScore] = useState(initialScore)
  const [difficulty, setDifficulty] = useState(initialDifficulty)
  const [questionStartCs, setQuestionStartCs] = useState(0)
  const [totalCs, setTotalCs] = useState(0)
  const [paused, setPaused] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [quitVisible, setQuitVisible] = useState(false)
  const [extraLifeFlash, setExtraLifeFlash] = useState(false)
  const answerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalCsRef = useRef(0)
  const questionStartRef = useRef(0)

  // Powerup state
  const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([])
  const [hiddenIndices, setHiddenIndices] = useState<number[]>([])
  const [timeBonus, setTimeBonus] = useState(0)
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set())

  const handleActivatePowerup = useCallback(async (powerupId: string, _pu: PowerupType) => {
    setActivePowerups((prev) => [...prev, { type: powerupId, applied: true }])

    if (powerupId === 'fifty-fifty' && question) {
      // Use read-only check-answer to find correct one
      const result = await checkAnswer(question.id, question.answers[0], 0, 30)
      const correctIdx = question.answers.indexOf(result.correctAnswer)
      const wrongIndices = question.answers
        .map((_, i) => i)
        .filter((i) => i !== correctIdx)
      const toHide = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2)
      setHiddenIndices(toHide)
    } else if (powerupId === 'extra-time') {
      setTimeBonus((b) => b + 1000)
    }
    // shield, skip-safe, streak-saver handled by sending powerup to API
  }, [question])

  const remainingCs = timeLimitCs - (totalCs - questionStartCs)
  const displayCs = Math.max(0, remainingCs + timeBonus)

  useEffect(() => {
    if (paused || !question) return
    const id = setInterval(() => {
      totalCsRef.current += 1
      setTotalCs(totalCsRef.current)
    }, 10)
    return () => clearInterval(id)
  }, [paused, question])

  useEffect(() => {
    if (timeLimitSeconds <= 0 || paused || !question) return
    const elapsed = totalCs - questionStartCs
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
  }, [timeLimitSeconds, timeLimitCs, paused, question, totalCs, questionStartCs])

  useEffect(() => {
    if (!timeUp) return
    if (answerTimerRef.current) clearTimeout(answerTimerRef.current)
    answerTimerRef.current = setTimeout(async () => {
      try {
        const result = await answerSurvival({
          sessionId,
          questionId: question.id,
          answer: '',
          timeElapsedCs: remainingCs <= 0 ? timeLimitCs : remainingCs,
          powerup: undefined,
        })
        if (result.gameOver) {
          onFinish(result.summary!)
        } else {
          advanceToNext(result)
        }
      } catch {
        try {
          const fr = await finishSurvival(sessionId)
          if (fr.summary) onFinish(fr.summary)
        } catch { onFinish({ totalQuestions: 0, correctAnswers: 0, wrongAnswers: 0, maxStreak: 0, finalStreak: 0, totalScore: 0, difficultyReached: '', isNewPersonalBestScore: false, isNewPersonalBestStreak: false, rank: null }) }
      }
    }, 2500)
    return () => { if (answerTimerRef.current) clearTimeout(answerTimerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp])

  const advanceToNext = useCallback((result: any) => {
    setQuestion(result.nextQuestion!)
    setQuestionNumber((n) => n + 1)
    setLives(result.lives!)
    setStreak(result.streak!)
    setScore(result.totalScore!)
    setTimeLimitSeconds(result.timeLimitSeconds!)
    setTimeLimitCs(result.timeLimitSeconds! * 100)
    setDifficulty(result.difficulty!)
    setQuestionStartCs(totalCsRef.current)
    questionStartRef.current = totalCsRef.current
    setPaused(false)
    setTimeUp(false)
    setHiddenIndices([])
    setTimeBonus(0)
    if (result.extraLifeAwarded) {
      setExtraLifeFlash(true)
      setTimeout(() => setExtraLifeFlash(false), 3000)
    }
  }, [])

  const currentPowerupRef = useRef<string | undefined>(undefined)

  const handleAnswer = useCallback(async (answerText: string): Promise<AnswerCheckResult> => {
    setPaused(true)
    if (answerTimerRef.current) clearTimeout(answerTimerRef.current)
    const answerTimeCs = totalCsRef.current - questionStartRef.current
    const pu = currentPowerupRef.current
    currentPowerupRef.current = undefined

    try {
      const result = await answerSurvival({
        sessionId,
        questionId: question.id,
        answer: answerText,
        timeElapsedCs: answerTimeCs,
        powerup: pu,
      })

      if (result.gameOver) {
        answerTimerRef.current = setTimeout(() => onFinish(result.summary!), 2500)
      } else {
        answerTimerRef.current = setTimeout(() => advanceToNext(result), 2500)
      }

      return { correct: result.correct, correctAnswer: result.correctAnswer }
    } catch {
      return { correct: false, correctAnswer: '' }
    }
  }, [sessionId, question, onFinish, advanceToNext])

  const handleQuit = useCallback(async () => {
    if (answerTimerRef.current) clearTimeout(answerTimerRef.current)
    try {
      const result = await finishSurvival(sessionId)
      if (result.summary) {
        onFinish(result.summary)
      } else {
        onFinish({ totalQuestions: 0, correctAnswers: 0, wrongAnswers: 0, maxStreak: 0, finalStreak: 0, totalScore: 0, difficultyReached: '', isNewPersonalBestScore: false, isNewPersonalBestStreak: false, rank: null })
      }
    } catch {
      onFinish({ totalQuestions: 0, correctAnswers: 0, wrongAnswers: 0, maxStreak: 0, finalStreak: 0, totalScore: 0, difficultyReached: '', isNewPersonalBestScore: false, isNewPersonalBestStreak: false, rank: null })
    }
  }, [sessionId, onFinish])

  const handleSkip = useCallback(async () => {
    if (paused) return
    setPaused(true)
    if (answerTimerRef.current) clearTimeout(answerTimerRef.current)
    const pu = currentPowerupRef.current
    currentPowerupRef.current = undefined

    try {
      const result = await answerSurvival({
        sessionId,
        questionId: question.id,
        answer: '',
        timeElapsedCs: totalCsRef.current - questionStartRef.current,
        powerup: pu,
      })

      if (result.gameOver) {
        answerTimerRef.current = setTimeout(() => onFinish(result.summary!), 2500)
      } else {
        answerTimerRef.current = setTimeout(() => advanceToNext(result), 1500)
      }
    } catch {
      setPaused(false)
    }
  }, [sessionId, question, paused, onFinish, advanceToNext])

  const activateWithPowerup = useCallback((powerupId: string, pu: PowerupType) => {
    // For powerups that need API awareness, set the ref before calling activate
    if (powerupId === 'shield' || powerupId === 'skip-safe' || powerupId === 'streak-saver') {
      currentPowerupRef.current = powerupId
    }
    handleActivatePowerup(powerupId, pu)
  }, [handleActivatePowerup])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!powerups || paused) return
      const key = e.key.toLowerCase()
      const index = { z: 0, x: 1, c: 2 }[key]
      if (index !== undefined && powerups[index]) {
        const pu = powerups[index]
        const alreadyUsed = activePowerups.some((a) => a.type === pu.id)
        if (!alreadyUsed) {
          activateWithPowerup(pu.id, pu)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [powerups, paused, activePowerups, activateWithPowerup])

  if (!question) {
    return (
      <div>
        <Text as="h1" variant="heading">Нет вопросов</Text>
        <p>Не удалось загрузить вопрос.</p>
      </div>
    )
  }

  const diffLabels: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' }
  const diffColors: Record<string, string> = { easy: '#6E9A90', medium: '#F9A253', hard: '#FF6633' }

  const hearts = []
  for (let i = 0; i < 5; i++) hearts.push(i < lives)

  return (
    <div>
      <div className={styles.quitRow}>
        <GameQuitConfirm visible={quitVisible} onRequestConfirm={() => setQuitVisible(true)} onConfirm={handleQuit} onCancel={() => setQuitVisible(false)} />
      </div>

      <div className={styles.topBar}>
        <div className={styles.lives}>
          {hearts.map((alive, i) => (
            <span key={i} className={alive ? styles.heartFilled : styles.heartEmpty}>{alive ? '\u2665' : '\u2661'}</span>
          ))}
          {extraLifeFlash && <span className={styles.extraLifeFlash}>+1 жизнь!</span>}
        </div>
        <div className={styles.score}>{score} очков</div>
      </div>

      <div className={styles.timerRow}><Timer value={displayCs} /></div>

      <div className={styles.progress}>
        <span>Вопрос {questionNumber}</span>
        <span className={styles.streak}>Стрик: {streak} {streak >= 5 ? '\u{1F525}' : ''}</span>
        <span className={styles.difficulty} style={{ color: diffColors[difficulty] || '#888' }}>{diffLabels[difficulty] || difficulty}</span>
        {timeUp && <span className={styles.timeUp}>время вышло</span>}
      </div>

      {question.imageUrl && <div className={styles.image}><img src={question.imageUrl} alt="" /></div>}
      <div className={styles.questionText}>
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
            {flaggedIds.has(question.id) ? '🚩' : '🚩'}
          </button>
        )}
      </div>

      <AnswerGrid key={`${sessionId}-${questionNumber}`} answers={question.answers} dimmedIndices={hiddenIndices} onAnswer={paused ? undefined : handleAnswer} />

      {hiddenIndices.length > 0 && <div className={styles.fiftyFifty}>🎯 50:50 активирован</div>}

      {paused && question.note && <div className={styles.note}>{question.note}</div>}

      <div className={styles.skipRow}>
        <Button variant="ghost" size="sm" onClick={handleSkip} disabled={paused}>{'\u21BA'} Пропустить</Button>
      </div>

      {powerups && powerups.length > 0 && (
        <PowerupBar
          available={powerups}
          active={activePowerups}
          gameMode="survival"
          onActivate={activateWithPowerup}
        />
      )}
    </div>
  )
}
