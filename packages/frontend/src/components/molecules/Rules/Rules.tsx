import { useState } from 'react'
import { Button } from '../../atoms/Button/Button'
import styles from './Rules.module.scss'

interface RulesProps {
  items: { icon: string; text: string }[]
  label?: string
}

export function Rules({ items, label = 'Правила' }: RulesProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className={styles.wrap}>
      <div className={styles.toggle}>
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? 'Скрыть' : label}
        </Button>
      </div>
      {open && (
        <div className={styles.block}>
          {items.map((item, i) => (
            <div key={i} className={styles.item}>
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
