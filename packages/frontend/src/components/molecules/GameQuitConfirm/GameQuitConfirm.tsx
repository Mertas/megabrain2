import { useRef, useEffect } from 'react'
import styles from './GameQuitConfirm.module.scss'

export interface GameQuitConfirmProps {
  visible: boolean
  onRequestConfirm: () => void
  onConfirm: () => void
  onCancel: () => void
}

export function GameQuitConfirm({ visible, onRequestConfirm, onConfirm, onCancel }: GameQuitConfirmProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (visible) confirmRef.current?.focus()
  }, [visible])

  return (
    <div className={styles.quit}>
      {!visible && (
        <button type="button" className={styles.trigger} onClick={onRequestConfirm}>
          <span aria-hidden="true">{'\u2620'}</span>
          <span>внезапно прекратить игру</span>
        </button>
      )}

      {visible && (
        <div className={styles.confirm}>
          <button ref={confirmRef} type="button" className={styles.submit} onClick={onConfirm}>
            да, что-то случилось, уходим
          </button>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            нет, продолжаем
          </button>
        </div>
      )}
    </div>
  )
}
