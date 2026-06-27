import styles from './CloseButton.module.scss'

export interface CloseButtonProps {
  /** Размер */
  size?: 'sm' | 'md'
  /** Текст для скринридеров */
  label?: string
  onClick?: () => void
}

export function CloseButton({ size = 'md', label = 'Закрыть', onClick }: CloseButtonProps) {
  const cls = [styles.button, styles[size]].join(' ')

  return (
    <button
      type="button"
      className={cls}
      onClick={onClick}
      aria-label={label}
    >
      {'\u2716'}
    </button>
  )
}
