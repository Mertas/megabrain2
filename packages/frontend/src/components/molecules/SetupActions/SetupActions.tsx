import type { ReactNode } from 'react'
import { Button } from '../../atoms/Button/Button'
import styles from './SetupActions.module.scss'

export interface SetupActionsProps {
  /** Подпись главной кнопки: «Начать игру», «Искать соперника»… */
  startLabel: string
  onStart: () => void
  disabled?: boolean
  /** Вторичное действие: ссылка или обработчик (магазин, таблица лидеров) */
  secondary?: { label: string; href?: string; onClick?: () => void }
  /** Подсказка под кнопкой, когда старт недоступен */
  hint?: string
  /** Ошибка сервера — заменяет подсказку */
  error?: string
  testId?: string
  children?: ReactNode
}

/**
 * Единый подвал форм настройки игры: главная кнопка, вторичная ссылка
 * и одна строка статуса (ошибка или подсказка) — одинаково во всех режимах.
 */
export function SetupActions({ startLabel, onStart, disabled, secondary, hint, error, testId, children }: SetupActionsProps) {
  return (
    <div className={styles.actions}>
      <div className={styles.row}>
        <Button variant="primary" size="lg" onClick={onStart} disabled={disabled} data-testid={testId}>
          {startLabel}
        </Button>
        {secondary && (
          <Button variant="link" size="sm" onClick={() => { if (secondary.onClick) secondary.onClick(); else if (secondary.href) window.location.href = secondary.href }}>
            {secondary.label}
          </Button>
        )}
      </div>
      {children}
      {error
        ? <div className={`${styles.status} ${styles.error}`}>{error}</div>
        : hint && <div className={styles.status}>{hint}</div>}
    </div>
  )
}
