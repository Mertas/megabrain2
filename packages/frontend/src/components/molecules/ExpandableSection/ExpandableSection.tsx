import { useState, useId } from 'react'
import styles from './ExpandableSection.module.scss'

export interface ExpandableSectionProps {
  trigger: string
  variant?: 'dotted' | 'plain'
  children: React.ReactNode
  defaultExpanded?: boolean
}

export function ExpandableSection({ trigger, variant = 'dotted', children, defaultExpanded = false }: ExpandableSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const id = useId()
  const panelId = `${id}-panel`

  return (
    <div className={styles.section}>
      <button
        type="button"
        className={`${styles.trigger} ${styles[variant]}`}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        {trigger}
      </button>
      {expanded && (
        <div id={panelId} className={styles.body}>
          {children}
        </div>
      )}
    </div>
  )
}
