import type { ReactNode } from 'react'
import styles from './Message.module.scss'

type MessageVariant = 'success' | 'error' | 'info' | 'warning'

interface MessageProps {
  children: ReactNode
  variant?: MessageVariant
}

export function Message({ children, variant = 'info' }: MessageProps) {
  return <div className={`${styles.msg} ${styles[variant]}`}>{children}</div>
}
