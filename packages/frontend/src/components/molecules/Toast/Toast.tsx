import { useEffect, useRef } from 'react'
import { CloseButton } from '../../atoms/CloseButton/CloseButton'
import styles from './Toast.module.scss'

export interface ToastProps {
  variant: 'correct' | 'wrong' | 'info'
  message: string
  closeable?: boolean
  onClose?: () => void
  autoHide?: number
}

export function Toast({ variant, message, closeable = true, onClose, autoHide = 0 }: ToastProps) {
  const timerRef = useRef<number>(0)

  useEffect(() => {
    if (autoHide <= 0) return
    timerRef.current = setTimeout(() => onClose?.(), autoHide)
    return () => clearTimeout(timerRef.current)
  }, [autoHide, onClose])

  return (
    <div className={`${styles.toast} ${styles[variant]}`} role="alert">
      <div className={styles.text}>{message}</div>
      {closeable && (
        <div className={styles.close}>
          <CloseButton size="sm" onClick={() => onClose?.()} label="Закрыть уведомление" />
        </div>
      )}
    </div>
  )
}
