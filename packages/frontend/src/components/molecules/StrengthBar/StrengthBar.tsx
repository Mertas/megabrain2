import styles from './StrengthBar.module.scss'

interface StrengthBarProps {
  strength: { score: number; label: string; color: string; feedback: string }
}

const labels = ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Отличный']
const colors = ['#FF0000', '#FF6633', '#F9A253', '#37CE74', '#00AA00']

export function StrengthBar({ strength }: StrengthBarProps) {
  const segs = labels.map((_, i) => i <= strength.score)

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        {segs.map((active, i) => (
          <span
            key={i}
            className={`${styles.seg} ${active ? styles.active : ''}`}
            style={{ background: active ? colors[strength.score] : undefined }}
          />
        ))}
      </div>
      <div className={styles.label} style={{ color: strength.color }}>
        {strength.label}
      </div>
    </div>
  )
}
