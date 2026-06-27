import styles from './TimerDigit.module.scss'

type TimerChar = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'c' | 'd'

const charClassMap: Record<TimerChar, string> = {
  '0': styles.n0, '1': styles.n1, '2': styles.n2, '3': styles.n3, '4': styles.n4,
  '5': styles.n5, '6': styles.n6, '7': styles.n7, '8': styles.n8, '9': styles.n9,
  'c': styles.c, 'd': styles.d,
}

export interface TimerDigitProps {
  char: TimerChar
  scale?: number
}

export function TimerDigit({ char, scale = 1 }: TimerDigitProps) {
  const cls = [styles.digit, charClassMap[char]].filter(Boolean).join(' ')

  return (
    <span
      className={cls}
      style={scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: 'top left' } : undefined}
      aria-hidden="true"
    />
  )
}
