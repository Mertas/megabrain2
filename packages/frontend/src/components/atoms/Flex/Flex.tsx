import type { ReactNode, CSSProperties } from 'react'
import styles from './Flex.module.scss'

interface FlexProps {
  children: ReactNode
  gap?: number
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  direction?: 'row' | 'column'
  className?: string
  style?: CSSProperties
}

const alignMap: Record<string, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end',
  stretch: 'stretch', baseline: 'baseline',
}

const justifyMap: Record<string, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end',
  between: 'space-between', around: 'space-around', evenly: 'space-evenly',
}

export function Flex({ children, gap, align, justify, wrap, direction, className, style }: FlexProps) {
  const s: CSSProperties = {
    display: 'flex',
    gap: gap != null ? `${gap}px` : undefined,
    alignItems: align ? alignMap[align] : undefined,
    justifyContent: justify ? justifyMap[justify] : undefined,
    flexWrap: wrap ? 'wrap' : undefined,
    flexDirection: direction,
    ...style,
  }
  return <div className={`${styles.flex}${className ? ` ${className}` : ''}`} style={s}>{children}</div>
}
