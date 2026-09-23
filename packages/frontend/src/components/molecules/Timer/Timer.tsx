import { TimerDigit } from '../../atoms/TimerDigit/TimerDigit'
import styles from './Timer.module.scss'

type TimerChar = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'c' | 'd'

export interface TimerProps {
  /** Что показывать на табло, в сотых секунды */
  value: number
  /** Полная длительность раунда — включает полосу прогресса (необязательно) */
  total?: number
  paused?: boolean
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

export function Timer({ value, total, paused = false }: TimerProps) {
  const digits = toDigits(value)

  const digitsEl = (
    <div className={`${styles.timer} ${paused ? styles.paused : ''}`}>
      {digits.map((char, i) => (
        <TimerDigit key={i} char={char} />
      ))}
    </div>
  )

  // Без total — только табло (как на соло/выживании/PvP)
  if (!total || total <= 0) return digitsEl

  const percent = Math.min(100, Math.max(0, (value / total) * 100))

  return (
    <div className={styles.wrap}>
      {digitsEl}
      <div className={styles.progress}>
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
