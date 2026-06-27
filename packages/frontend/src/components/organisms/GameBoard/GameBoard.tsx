import { useState, useEffect, useRef, useCallback } from 'react'
import { Timer } from '../../molecules/Timer/Timer'
import { AnswerGrid, type AnswerCheckResult } from '../../molecules/AnswerGrid/AnswerGrid'
import { GameQuitConfirm } from '../../molecules/GameQuitConfirm/GameQuitConfirm'
import { useToast } from '../../molecules/ToastContainer/ToastContainer'
import { Button } from '../../atoms/Button/Button'
import { checkAnswer } from '../../../lib/api'
import styles from './GameBoard.module.scss'

export interface Question {
  id: number
  text: string
  imageUrl?: string
  answers: string[]
  note?: string
}

export interface GameResult {
  total: number
  correct: number
  timeCs: number
  questions: { question: Question; selectedIndex: number | null; correctIndex: number }[]
}

export interface GameBoardProps {
  questions: Question[]
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

export function GameBoard({ questions, onFinish }: GameBoardProps) {
  const [idx, setIdx] = useState(0)
  const correctCountRef = useRef(0)
  const timerCsRef = useRef(0)
  const [timerCs, setTimerCs] = useState(0)
  const [paused, setPaused] = useState(false)
  const [quitVisible, setQuitVisible] = useState(false)
  const resultsRef = useRef<GameResult['questions']>([])
  const { show, toasts, remove, ToastContainer } = useToast()

  const question = questions[idx]

  useEffect(() => {
    if (paused || !question) return
    const id = setInterval(() => {
      timerCsRef.current += 1
      setTimerCs(timerCsRef.current)
    }, 10)
    return () => clearInterval(id)
  }, [paused, question])

  const advance = useCallback(() => {
    if (idx + 1 >= questions.length) {
      onFinish({
        total: questions.length,
        correct: correctCountRef.current,
        timeCs: timerCsRef.current,
        questions: [...resultsRef.current],
      })
    } else {
      setIdx((i) => i + 1)
      setPaused(false)
    }
  }, [idx, questions.length, onFinish])

  const handleAnswer = useCallback(async (answerText: string): Promise<AnswerCheckResult> => {
    setPaused(true)
    const result = await checkAnswer(question.id, answerText)

    if (result.correct) correctCountRef.current++
    const selectedIndex = question.answers.indexOf(answerText)
    const correctIndex = question.answers.indexOf(result.correctAnswer)
    resultsRef.current.push({ question, selectedIndex, correctIndex })

    show({
      variant: result.correct ? 'correct' : 'wrong',
      message: result.correctAnswer,
      autoHide: 2300,
    })

    setTimeout(advance, 2500)
    return result
  }, [question, show, advance])

  const handleSkip = () => {
    resultsRef.current.push({ question, selectedIndex: null, correctIndex: 0 })
    advance()
  }

  const handleQuit = () => {
    onFinish({
      total: questions.length,
      correct: correctCountRef.current,
      timeCs: timerCsRef.current,
      questions: [...resultsRef.current],
    })
  }

  if (!question) {
    return (
      <div>
        <h1>Нет вопросов</h1>
        <p>Выберите темы и начните игру.</p>
      </div>
    )
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className={styles.quitRow}>
        <GameQuitConfirm
          visible={quitVisible}
          onRequestConfirm={() => setQuitVisible(true)}
          onConfirm={handleQuit}
          onCancel={() => setQuitVisible(false)}
        />
      </div>

      <div className={styles.timerRow}>
        <Timer elapsedCentiseconds={timerCs} />
      </div>

      <div className={styles.progress}>
        {correctCountRef.current} {plural(correctCountRef.current, ['ответ', 'ответа', 'ответов'])} из {idx + 1}
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
        onAnswer={handleAnswer}
      />

      <div className={styles.skipRow}>
        <Button variant="ghost" size="sm" onClick={handleSkip}>
          {'\u21BA'} Пропустить
        </Button>
      </div>
    </div>
  )
}
