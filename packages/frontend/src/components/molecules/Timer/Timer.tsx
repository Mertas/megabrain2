import { TimerDigit } from '../../atoms/TimerDigit/TimerDigit'
import styles from './Timer.module.scss'

type TimerChar = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'c' | 'd'

export interface TimerProps {
  elapsedCentiseconds: number
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

export function Timer({ elapsedCentiseconds, isPaused = false }: TimerProps) {
  const digits = toDigits(elapsedCentiseconds)

  return (
    <div className={`${styles.timer} ${isPaused ? styles.paused : ''}`}>
      {digits.map((char, i) => (
        <TimerDigit key={i} char={char} />
      ))}
    </div>
  )
}
