import { forwardRef } from 'react'
import styles from './Icon.module.scss'

export interface IconProps {
  symbol: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'inherit'
  color?: string
  onClick?: () => void
  label?: string
  className?: string
}

const sizeMap = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
  inherit: styles.inheritSize,
} as const

export const Icon = forwardRef<HTMLSpanElement, IconProps>(
  ({ symbol, size = 'md', color, onClick, label, className }, ref) => {
    const cls = [
      styles.icon,
      sizeMap[size],
      onClick && styles.clickable,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <span
        ref={ref}
        className={cls}
        style={color ? { color } : undefined}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
        aria-label={label}
      >
        {symbol}
      </span>
    )
  },
)

Icon.displayName = 'Icon'
