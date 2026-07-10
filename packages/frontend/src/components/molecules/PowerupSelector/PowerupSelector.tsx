import type { PowerupType } from '../../../lib/api'
import { Tooltip } from '../../atoms/Tooltip/Tooltip'
import styles from './PowerupSelector.module.scss'

interface PowerupSelectorProps {
  types: PowerupType[]
  selected: string[]
  onChange: (ids: string[]) => void
  max?: number
  showKeys?: boolean
}

export function PowerupSelector({ types, selected, onChange, max = 3, showKeys = true }: PowerupSelectorProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.title}>Power-ups ({selected.length}/{max})</div>
      <div className={styles.grid}>
        {types.map((pu) => {
          const sel = selected.includes(pu.id)
          const full = !sel && selected.length >= max
          return (
            <Tooltip key={pu.id} text={pu.description} position="top">
              <button
                className={`${styles.btn} ${sel ? styles.selected : ''}`}
                onClick={() => {
                  if (sel) onChange(selected.filter((x) => x !== pu.id))
                  else if (!full) onChange([...selected, pu.id])
                }}
                disabled={full}
                data-testid="powerup-btn"
              >{pu.icon} {pu.name}</button>
            </Tooltip>
          )
        })}
      </div>
      {showKeys && selected.length > 0 && (
        <div className={styles.keys}>Z / X / C в игре для активации</div>
      )}
    </div>
  )
}
