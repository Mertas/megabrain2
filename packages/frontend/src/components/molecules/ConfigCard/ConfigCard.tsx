import type { ReactNode } from 'react'
import styles from './ConfigCard.module.scss'

interface ConfigCardProps {
  children: ReactNode
}

export function ConfigCard({ children }: ConfigCardProps) {
  return <div className={styles.card}>{children}</div>
}
