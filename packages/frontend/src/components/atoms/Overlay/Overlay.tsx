import { useEffect, useRef } from 'react'
import styles from './Overlay.module.scss'

export interface OverlayProps {
  /** Показан ли оверлей */
  isOpen: boolean
  /** Обработчик клика по оверлею */
  onClose?: () => void
  /** Длительность fade-анимации (ms) */
  duration?: number
  /** z-index */
  zIndex?: number
}

export function Overlay({ isOpen, onClose, duration = 300, zIndex = 1000 }: OverlayProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.transition = `opacity ${duration}ms`
    if (isOpen) {
      el.style.display = 'block'
      requestAnimationFrame(() => { el.style.opacity = '0.8' })
    } else {
      el.style.opacity = '0'
      const timer = setTimeout(() => { el.style.display = 'none' }, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return (
    <div
      ref={ref}
      className={styles.overlay}
      style={{ zIndex }}
      onClick={onClose}
    />
  )
}
