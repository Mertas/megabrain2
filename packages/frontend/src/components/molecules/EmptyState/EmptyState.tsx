import type { ReactNode } from 'react'
import styles from './EmptyState.module.scss'

export interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  /** Кнопка/ссылка действия */
  action?: ReactNode
}

/**
 * Единая заглушка «здесь пусто» для списков, таблиц и партий.
 */
export function EmptyState({ icon = '∅', title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.desc}>{description}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
