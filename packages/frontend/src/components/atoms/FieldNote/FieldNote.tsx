import styles from './FieldNote.module.scss'

export interface FieldNoteProps {
  /** Тип: hint (серая подсказка) или copyright (белый текст на тёмном фоне) */
  variant?: 'hint' | 'copyright'
  children: React.ReactNode
}

export function FieldNote({ variant = 'hint', children }: FieldNoteProps) {
  return <div className={styles[variant]}>{children}</div>
}
