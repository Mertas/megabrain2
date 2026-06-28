import { useState, useEffect, useRef, useCallback } from 'react'
import { Timer } from '../../molecules/Timer/Timer'
import { AnswerGrid, type AnswerCheckResult } from '../../molecules/AnswerGrid/AnswerGrid'
import { GameQuitConfirm } from '../../molecules/GameQuitConfirm/GameQuitConfirm'
import { Button } from '../../atoms/Button/Button'
import { checkAnswer } from '../../../lib/api'
import { calcScore } from '../../../lib/score'
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

export function GameBoard({ questions, timeMode, timeSeconds, isAdmin = false, onFinish }: GameBoardProps) {
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

  const question = questions[idx]
  const timeLimitCs = timeSeconds * 100

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
    }
  }, [idx, questions.length, finishGame])

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

    setLastCorrect(result.correct)
    setLastTimeCs(answerTimeCs)

    if (result.correct) correctCountRef.current++

    const selectedIndex = question.answers.indexOf(answerText)
    const correctIndex = question.answers.indexOf(result.correctAnswer)
    resultsRef.current.push({ question, selectedIndex, correctIndex, timeElapsedCs: answerTimeCs })

    if (isAdmin) {
      const points = calcScore(answerTimeCs, timeMode, timeSeconds, questions.length, result.correct)
      setAdminScore((s) => Math.round((s + points) * 100) / 100)
    }

    advanceTimerRef.current = setTimeout(advance, 2500)
    return result
  }, [question, timeMode, timeSeconds, questions.length, isAdmin, advance])

  const handleSkip = () => {
    const timeAtSkip = totalCsRef.current - questionStartCsRef.current
    resultsRef.current.push({ question, selectedIndex: null, correctIndex: 0, timeElapsedCs: timeAtSkip })
    advance()
  }

  const handleQuit = () => {
    finishGame()
  }

  if (!question) {
    return (
      <div>
        <h1>Нет вопросов</h1>
        <p>Выберите темы и начните игру.</p>
      </div>
    )
  }

  const timeLimitActive = timeSeconds > 0
  const displayCs = timeMode === 'per_question' && timeLimitActive
    ? Math.max(0, remainingCs)
    : timeLimitActive
      ? Math.max(0, timeLimitCs - totalCs)
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
        {timeUp && <span style={{ marginLeft: 12, color: '#FF0000' }}>время вышло</span>}
        {isAdmin && <span style={{ marginLeft: 12, color: '#6E9A90' }}>счёт: {adminScore}</span>}
      </div>

      {question.imageUrl && (
        <div className={styles.image}>
          <img src={question.imageUrl} alt="" />
        </div>
      )}
      <div className={styles.question}>{question.text}</div>

      <AnswerGrid
        key={idx}
        answers={question.answers}
        onAnswer={paused ? undefined : handleAnswer}
      />

      {paused && (
        <>
          {question.note && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#EDEBD2', borderRadius: 6, fontSize: 13, lineHeight: 1.5, color: '#0E2136', fontStyle: 'italic' }}>
              {question.note}
            </div>
          )}
          {isAdmin && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#6E9A90' }}>
              вопрос: +{lastPoints} очков | накоплено: {adminScore}
            </div>
          )}
        </>
      )}

      <div className={styles.skipRow}>
        <Button variant="ghost" size="sm" onClick={handleSkip} disabled={paused}>
          {'\u21BA'} Пропустить
        </Button>
      </div>
    </div>
  )
}
