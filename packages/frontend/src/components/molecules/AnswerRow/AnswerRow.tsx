import { Button } from '../../atoms/Button/Button'
import styles from './AnswerRow.module.scss'

interface AnswerRowProps {
  index: number
  value: string
  onChange: (value: string) => void
  onRemove?: () => void
  placeholder?: string
}

export function AnswerRow({ index, value, onChange, onRemove, placeholder = `Ответ ${index + 1}` }: AnswerRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.num}>{index + 1}.</span>
      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {onRemove && (
        <Button variant="ghost" size="sm" onClick={onRemove} aria-label="Удалить ответ">
          ×
        </Button>
      )}
    </div>
  )
}
