import styles from './Spinner.module.scss'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  label?: string
  inline?: boolean
}

export function Spinner({ size = 'md', color, label = 'Загрузка...', inline = false }: SpinnerProps) {
  const cls = [styles.spinner, styles[size], inline && styles.inline].filter(Boolean).join(' ')

  return (
    <span
      className={cls}
      style={color ? { borderTopColor: color } : undefined}
      role="status"
      aria-label={label}
    >
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {label}
      </span>
    </span>
  )
}
