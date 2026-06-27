import { useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Toast, type ToastProps } from '../Toast/Toast'
import styles from './ToastContainer.module.scss'

export interface ToastItem {
  id: string
  props: Omit<ToastProps, 'onClose'>
  exiting?: boolean
  entering?: boolean
}

let nextId = 0
const QUEUE_DELAY = 350

interface ToastContainerProps {
  toasts: ToastItem[]
  onRemove: (id: string) => void
}

function ToastContainerInner({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return createPortal(
    <div className={styles.container}>
      {toasts.map((item) => (
        <div
          key={item.id}
          className={`${styles.item} ${item.entering ? styles.itemEntering : ''} ${item.exiting ? styles.itemExiting : ''}`}
        >
          <Toast {...item.props} onClose={() => onRemove(item.id)} />
        </div>
      ))}
    </div>,
    document.body,
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const queueRef = useRef<Array<Omit<ToastProps, 'onClose'>>>([])
  const processingRef = useRef(false)

  const processQueue = useCallback(() => {
    if (processingRef.current) return
    if (queueRef.current.length === 0) return

    processingRef.current = true
    const item = queueRef.current.shift()!
    const id = String(++nextId)

    setToasts((prev) => [...prev, { id, props: item, entering: true }])

    requestAnimationFrame(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, entering: false } : t)),
      )
    })

    setTimeout(() => {
      processingRef.current = false
      processQueue()
    }, QUEUE_DELAY)
  }, [])

  const show = useCallback((props: Omit<ToastProps, 'onClose'>) => {
    queueRef.current.push(props)
    processQueue()
  }, [processQueue])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 350)
  }, [])

  return { show, toasts, remove, ToastContainer: ToastContainerInner }
}
