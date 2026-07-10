import { useState, useCallback } from 'react'
import { Tooltip } from '../../atoms/Tooltip/Tooltip'
import { usePowerup } from '../../../lib/api'
import type { PowerupType } from '../../../lib/api'
import styles from './PowerupBar.module.scss'

export interface ActivePowerup {
  type: string
  applied: boolean
}

interface Props {
  available: PowerupType[]
  active: ActivePowerup[]
  gameMode: string
  gameId?: number
  onActivate: (powerupId: string, pu: PowerupType) => void
}

export function PowerupBar({ available, active, gameMode, gameId, onActivate }: Props) {
  const [flashing, setFlashing] = useState<string | null>(null)

  const handleClick = useCallback(async (pu: PowerupType) => {
    // Activate immediately — no confirmation step
    setFlashing(pu.id)
    setTimeout(() => setFlashing(null), 600)
    try {
      await usePowerup(pu.id, gameMode, gameId)
    } catch { /* handled silently */ }
    onActivate(pu.id, pu)
  }, [gameMode, gameId, onActivate])

  return (
    <div className={styles.bar}>
      {available.map((pu, i) => {
        const used = active.some((a) => a.type === pu.id && a.applied)
        const flash = flashing === pu.id
        const keyLabel = ['Z', 'X', 'C'][i] || ''

        return (
          <Tooltip key={pu.id} text={pu.description} position="top">
            <button
              className={`${styles.btn} ${used ? styles.used : ''} ${flash ? styles.flash : ''}`}
              onClick={() => handleClick(pu)}
              disabled={used}
            >
              <span className={styles.icon}>{pu.icon}</span>
              <span className={styles.label}>{pu.name}</span>
              <span className={styles.key}>{keyLabel}</span>
            </button>
          </Tooltip>
        )
      })}
    </div>
  )
}
