import styles from './Badge.module.scss'

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'muted'

export interface BadgeProps {
  variant?: BadgeVariant
  pill?: boolean
  size?: 'sm' | 'md'
  children: React.ReactNode
}

export function Badge({ variant = 'info', pill = false, size = 'md', children }: BadgeProps) {
  const cls = [styles.badge, styles[variant], pill && styles.pill, styles[size]]
    .filter(Boolean)
    .join(' ')

  return <span className={cls}>{children}</span>
}
