import type { ReactNode } from 'react'
import styles from './Center.module.scss'

interface CenterProps {
  children: ReactNode
  padding?: number
  maxWidth?: number
  className?: string
}

export function Center({ children, padding = 40, maxWidth, className }: CenterProps) {
  const style = { padding, ...(maxWidth ? { maxWidth: `${maxWidth}px`, margin: '0 auto' } : {}) }
  return (
    <div className={`${styles.center}${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </div>
  )
}
