import styles from './TimeEstimator.module.scss'

export interface TimeEstimatorProps {
  mode: 'per_question' | 'per_game'
  timeSeconds: number
  totalItems: number
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  if (s === 0) return `${m} минут`
  if (m === 0) return `${s} секунд`
  return `${m} мин ${s} сек`
}

export function TimeEstimator({ mode, timeSeconds, totalItems }: TimeEstimatorProps) {
  if (totalItems <= 0) return null

  if (mode === 'per_question') {
    return <span className={styles.est}>({formatTime(timeSeconds * totalItems)} на игру)</span>
  }

  const perItem = Math.floor(timeSeconds / totalItems)
  return <span className={styles.est}>({formatTime(perItem)} на вопрос)</span>
}
