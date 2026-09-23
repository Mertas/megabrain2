import type { PowerupType } from '../../../lib/api'
import { Tooltip } from '../../atoms/Tooltip/Tooltip'
import styles from './PowerupSelector.module.scss'

interface PowerupSelectorProps {
  types?: PowerupType[]
  selected?: string[]
  onChange: (ids: string[]) => void
  max?: number
  showKeys?: boolean
  /** Альтернативные имена пропсов (используются в Blitz): available/selectedIds/maxSelect */
  available?: PowerupType[]
  selectedIds?: string[]
  maxSelect?: number
}

export function PowerupSelector({
  types,
  selected,
  available,
  selectedIds,
  onChange,
  max,
  maxSelect,
  showKeys = true,
}: PowerupSelectorProps) {
  const list = types ?? available ?? []
  const sel = selected ?? selectedIds ?? []
  const limit = max ?? maxSelect ?? 3

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>Power-ups ({sel.length}/{limit})</div>
      <div className={styles.grid}>
        {list.map((pu) => {
          const isSel = sel.includes(pu.id)
          const full = !isSel && sel.length >= limit
          return (
            <Tooltip key={pu.id} text={pu.description} position="top">
              <button
                className={`${styles.btn} ${isSel ? styles.selected : ''}`}
                onClick={() => {
                  if (isSel) onChange(sel.filter((x) => x !== pu.id))
                  else if (!full) onChange([...sel, pu.id])
                }}
                disabled={full}
                data-testid="powerup-btn"
              >{pu.icon} {pu.name}</button>
            </Tooltip>
          )
        })}
      </div>
      {showKeys && sel.length > 0 && (
        <div className={styles.keys}>Z / X / C в игре для активации</div>
      )}
    </div>
  )
}
