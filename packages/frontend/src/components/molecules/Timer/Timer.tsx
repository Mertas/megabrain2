import { TimerDigit } from '../../atoms/TimerDigit/TimerDigit'
import styles from './Timer.module.scss'

type TimerChar = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'c' | 'd'

export interface TimerProps {
  /** Что показывать на табло, в сотых секунды. Может быть «прошедшим» или «оставшимся» временем. */
  elapsedCentiseconds?: number
  /** Альтернативное имя для отображаемого значения (используется в Blitz). */
  displayCs?: number
  /** Полная длительность раунда в сотых секунды — включает полосу прогресса. */
  totalCs?: number
  isPaused?: boolean
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function toDigits(centiseconds: number): TimerChar[] {
  const min = Math.floor(centiseconds / 6000)
  const sec = Math.floor((centiseconds - min * 6000) / 100)
  const cs = centiseconds % 100
  const str = `${pad(min)}c${pad(sec)}d${pad(cs)}`
  return [...str] as TimerChar[]
}

export function Timer({ elapsedCentiseconds = 0, displayCs, totalCs, isPaused = false }: TimerProps) {
  const value = displayCs ?? elapsedCentiseconds
  const digits = toDigits(value)

  const digitsEl = (
    <div className={`${styles.timer} ${isPaused ? styles.paused : ''}`}>
      {digits.map((char, i) => (
        <TimerDigit key={i} char={char} />
      ))}
    </div>
  )

  // Без totalCs компонент выглядит ровно как раньше (табло цифр)
  if (!totalCs || totalCs <= 0) return digitsEl

  const percent = Math.min(100, Math.max(0, (value / totalCs) * 100))

  return (
    <div className={styles.wrap}>
      {digitsEl}
      <div className={styles.progress}>
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
