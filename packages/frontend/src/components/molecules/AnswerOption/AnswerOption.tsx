import styles from './AnswerOption.module.scss'

export interface AnswerOptionProps {
  number: number
  text: string
  onClick?: () => void
  state?: 'idle' | 'correct' | 'wrong'
  muted?: boolean
  flash?: boolean
  dimmed?: boolean
}

export function AnswerOption({ number, text, onClick, state = 'idle', muted = false, flash = false, dimmed = false }: AnswerOptionProps) {
  const clickable = !!onClick && state === 'idle' && !dimmed

  const cls = [
    styles.answer,
    clickable && styles.clickable,
    flash && styles.flash,
    state === 'correct' && styles.correct,
    state === 'wrong' && styles.wrong,
    muted && styles.muted,
    dimmed && styles.dimmed,
  ].filter(Boolean).join(' ')

  return (
    <button type="button" className={cls} onClick={clickable ? onClick : undefined} disabled={!clickable} data-testid="answer-option">
      <span className={styles.num}>{number}.</span>
      <span className={styles.text}>{text}</span>
      {state === 'correct' && (
        <span className={`${styles.caption} ${muted ? styles.capMuted : styles.capCorrect}`}>верный ответ</span>
      )}
      {state === 'wrong' && (
        <span className={`${styles.caption} ${styles.capWrong}`}>ваш ответ неверен</span>
      )}
    </button>
  )
}
