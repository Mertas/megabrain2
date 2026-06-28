import { useState } from 'react'
import { AnswerOption } from '../AnswerOption/AnswerOption'
import styles from './AnswerResultItem.module.scss'

export interface AnswerResultItemProps {
  /** Номер вопроса */
  index?: number
  /** Текст вопроса */
  question: string
  /** Картинка к вопросу */
  imageUrl?: string
  /** 4-8 вариантов ответа */
  answers: string[]
  /** Индекс правильного ответа */
  correctIndex: number
  /** Индекс выбранного пользователем ответа (null = не ответил) */
  selectedIndex: number | null
  /** Пояснение */
  explanation?: string
  /** Примечание (от автора вопроса) */
  note?: string
  /** Источник */
  explanationSource?: string
  /** Очки за вопрос */
  points?: number
  /** Колбэк для репорта ошибки */
  onReportMistake?: () => void
}

export function AnswerResultItem({
  index,
  question,
  imageUrl,
  answers,
  correctIndex,
  selectedIndex,
  explanation,
  note,
  explanationSource,
  points,
  onReportMistake,
}: AnswerResultItemProps) {
  const [showExplanation, setShowExplanation] = useState(false)
  const wasCorrect = selectedIndex === correctIndex

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {index !== undefined && <span className={styles.idx}>{index + 1}.</span>}
        <div className={styles.body}>
          {imageUrl && (
            <img src={imageUrl} alt="" className={styles.image} />
          )}
          <span className={styles.question}>{question}</span>
        </div>
        {points !== undefined && (
          <span className={styles.points}>+{points}</span>
        )}
      </div>

      <div className={styles.answers}>
        {answers.map((text, i) => {
          const isCorrect = i === correctIndex
          const wasSelected = i === selectedIndex
          let state: 'idle' | 'correct' | 'wrong' = 'idle'
          let muted = false

          if (wasCorrect && wasSelected) {
            state = 'correct'
          } else if (isCorrect && !wasCorrect) {
            state = 'correct'
            muted = true
          } else if (wasSelected && !wasCorrect) {
            state = 'wrong'
          }

          return (
            <AnswerOption
              key={i}
              number={i + 1}
              text={text}
              state={state}
              muted={muted}
            />
          )
        })}
      </div>

      {note && <div className={styles.note}>{note}</div>}

      <div className={styles.footer}>
        {explanation && (
          <button
            type="button"
            className={styles.expand}
            onClick={() => setShowExplanation(!showExplanation)}
            aria-expanded={showExplanation}
          >
            {showExplanation ? 'скрыть' : 'почитать про это'}
          </button>
        )}
        {onReportMistake && (
          <button type="button" className={styles.mistake} onClick={onReportMistake}>
            ошибка!
          </button>
        )}
      </div>

      {showExplanation && explanation && (
        <div className={styles.explanation}>
          <div className={styles.explanationText}>{explanation}</div>
          {explanationSource && (
            <div className={styles.source}>
              Источник{' '}
              <a href={explanationSource} target="_blank" rel="noopener noreferrer">
                Википедия
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
