import { useState, useCallback, useRef, useEffect } from 'react'
import { AnswerOption } from '../AnswerOption/AnswerOption'
import styles from './AnswerGrid.module.scss'

export interface AnswerCheckResult {
  correct: boolean
  correctAnswer: string
}

export interface AnswerGridProps {
  answers: string[]
  question?: string
  bordered?: boolean
  onAnswer?: (answerText: string) => Promise<AnswerCheckResult>
  standalone?: boolean
}

export function AnswerGrid({ answers, question, bordered = true, onAnswer, standalone = false }: AnswerGridProps) {
  const [phase, setPhase] = useState<'idle' | 'flash' | 'reveal'>('idle')
  const [selected, setSelected] = useState<number | null>(null)
  const [serverCorrectIndex, setServerCorrectIndex] = useState(-1)
  const processingRef = useRef(false)

  const handleClick = useCallback(async (index: number) => {
    if (processingRef.current || phase !== 'idle') return
    processingRef.current = true

    const answerText = answers[index]
    setSelected(index)
    setPhase('flash')

    setTimeout(() => {
      setPhase('reveal')
    }, 400)

    if (onAnswer) {
      const result = await onAnswer(answerText)
      setServerCorrectIndex(answers.indexOf(result.correctAnswer))
      // Already set to 'reveal' by setTimeout above, but set again in case API is faster
      setPhase('reveal')
    }
  }, [phase, answers, onAnswer])

  // Keyboard support: 1-4 keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (processingRef.current || phase !== 'idle') return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return
      const idx = parseInt(e.key)
      if (idx >= 1 && idx <= 4 && idx <= answers.length) {
        handleClick(idx - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, answers, handleClick])

  const handleReset = () => {
    processingRef.current = false
    setPhase('idle')
    setSelected(null)
    setServerCorrectIndex(-1)
  }

  const correctIndex = serverCorrectIndex >= 0 ? serverCorrectIndex : -1

  return (
    <div>
      {question && <div className={styles.question}>{question}</div>}
      <div className={`${styles.grid} ${bordered ? styles.bordered : ''}`}>
        {answers.map((text, i) => {
          const isReveal = phase === 'reveal'
          const state = isReveal
            ? correctIndex >= 0 && correctIndex === i
              ? ('correct' as const)
              : selected === i
                ? ('wrong' as const)
                : undefined
            : undefined

          const muted = isReveal && correctIndex >= 0 && correctIndex === i && selected !== correctIndex

          return (
            <AnswerOption
              key={i}
              number={i + 1}
              text={text}
              state={state}
              muted={muted}
              flash={phase === 'flash' && i === selected}
              onClick={phase === 'idle' ? () => handleClick(i) : undefined}
            />
          )
        })}
      </div>
      {standalone && phase === 'reveal' && (
        <div className={styles.again}>
          <button type="button" className={styles.againBtn} onClick={handleReset}>
            сыграть ещё
          </button>
        </div>
      )}
    </div>
  )
}
