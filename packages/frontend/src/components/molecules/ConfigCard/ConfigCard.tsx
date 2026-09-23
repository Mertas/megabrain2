import type { ReactNode } from 'react'
import styles from './ConfigCard.module.scss'

interface ConfigCardProps {
  children: ReactNode
  label?: string
  hint?: string
}

export function ConfigCard({ children, label, hint }: ConfigCardProps) {
  return (
    <div className={styles.card}>
      {label && <div className={styles.label}>{label}</div>}
      {children}
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  )
}
