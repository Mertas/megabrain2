import styles from './Divider.module.scss'

type DividerVariant = 'solid' | 'dashed' | 'dotted'

export interface DividerProps {
  variant?: DividerVariant
  label?: string
  spacing?: 'sm' | 'md' | 'lg'
  color?: string
}

export function Divider({ variant = 'solid', label, spacing = 'md', color }: DividerProps) {
  if (!label) {
    return (
      <hr
        className={`${styles.line} ${styles[variant]} ${styles[`spacing${capitalize(spacing)}`]}`}
        style={color ? { borderColor: color } : undefined}
        role="separator"
      />
    )
  }

  return (
    <div className={`${styles.wrapper} ${styles[`spacing${capitalize(spacing)}`]}`} role="separator">
      <span className={`${styles.line} ${styles[variant]}`} style={color ? { borderColor: color } : undefined} />
      <span className={styles.label}>{label}</span>
      <span className={`${styles.line} ${styles[variant]}`} style={color ? { borderColor: color } : undefined} />
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
