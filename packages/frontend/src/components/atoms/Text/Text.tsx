import type { CSSProperties, ReactNode } from 'react'
import styles from './Text.module.scss'

type TextVariant = 'body' | 'muted' | 'error' | 'success' | 'accent' | 'heading'
type TextSize = 'sm' | 'md' | 'lg' | 'xl'

interface TextProps {
  children: ReactNode
  variant?: TextVariant
  size?: TextSize
  center?: boolean
  className?: string
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3'
  style?: CSSProperties
  'data-testid'?: string
}

const sizeMap: Record<TextSize, string> = { sm: '12px', md: '14px', lg: '17px', xl: '24px' }

export function Text({ children, variant = 'body', size, center, className, as: Tag = 'span', style, 'data-testid': testId }: TextProps) {
  const cls = [
    styles.text,
    styles[variant],
    center && styles.center,
    className,
  ].filter(Boolean).join(' ')

  const mergedStyle: CSSProperties | undefined = size
    ? { fontSize: sizeMap[size], ...style }
    : style

  return <Tag className={cls} style={mergedStyle} data-testid={testId}>{children}</Tag>
}
