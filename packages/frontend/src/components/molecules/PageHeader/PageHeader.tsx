import type { ReactNode } from 'react'
import { Text } from '../../atoms/Text/Text'
import { Rules } from '../Rules/Rules'
import styles from './PageHeader.module.scss'

export interface PageHeaderProps {
  /** Эмодзи/символ страницы */
  icon?: string
  title: string
  description?: string
  /** Правила режима — сворачиваемый блок (тот же Rules, что и раньше) */
  rules?: { icon: string; text: string }[]
  /** Кнопки/ссылки справа от заголовка */
  actions?: ReactNode
  /** Дополнительный контент под описанием (например, статистика) */
  children?: ReactNode
}

/**
 * Единая шапка страницы: иконка + заголовок + описание (+ правила и действия).
 * Заменяет и старый Hero, и самодельные <h1> на страницах.
 */
export function PageHeader({ icon, title, description, rules, actions, children }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.titleRow}>
        <Text as="h1" variant="heading" data-testid="page-title">{title}</Text>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {description && <p className={styles.desc}>{description}</p>}
      {children}
      {rules && rules.length > 0 && (
        <div className={styles.rules}>
          <Rules items={rules} />
        </div>
      )}
    </header>
  )
}
