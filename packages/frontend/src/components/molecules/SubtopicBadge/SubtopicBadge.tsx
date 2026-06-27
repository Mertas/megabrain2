import styles from './SubtopicBadge.module.scss'

export interface SubtopicBadgeProps {
  name: string
  selected?: boolean
  onClick?: () => void
}

export function SubtopicBadge({ name, selected = false, onClick }: SubtopicBadgeProps) {
  const cls = [styles.badge, selected && styles.selected].filter(Boolean).join(' ')

  if (onClick) {
    return (
      <span
        className={`${cls} ${styles.clickable}`}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
      >
        {name}
      </span>
    )
  }

  return <span className={cls}>{name}</span>
}
