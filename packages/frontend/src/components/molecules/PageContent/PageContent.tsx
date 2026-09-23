import type { ReactNode } from 'react'
import styles from './PageContent.module.scss'

export interface PageContentProps {
  children: ReactNode
  /** narrow — колонка 650px (настройки/формы), default — 756px (по умолчанию), wide — 900px (таблицы) */
  width?: 'narrow' | 'default' | 'wide'
  className?: string
}

const widthClass = {
  narrow: styles.narrow,
  default: styles.default,
  wide: styles.wide,
}

/**
 * Единая колонка контента страницы: одна ширина и вертикальные отступы у всех страниц.
 */
export function PageContent({ children, width = 'default', className }: PageContentProps) {
  const cls = [styles.content, widthClass[width], className].filter(Boolean).join(' ')
  return <div className={cls}>{children}</div>
}
