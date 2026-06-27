import type { ReactNode } from 'react'
import { Radio } from '../../atoms/Radio/Radio'
import { Select } from '../../atoms/Select/Select'
import styles from './TimeSettingRow.module.scss'

export interface TimeSettingRowProps {
  label: string
  name: string
  options: { value: string; label: string }[]
  defaultChecked?: boolean
  hint?: ReactNode
  value?: string
  onTimeChange?: (value: string) => void
}

export function TimeSettingRow({ label, name, options, defaultChecked, hint, value, onTimeChange }: TimeSettingRowProps) {
  return (
    <div className={styles.row}>
      <Radio name={name} label={label} defaultChecked={defaultChecked} />
      <Select
        className={styles.select}
        options={options}
        value={value}
        onChange={onTimeChange ? (e) => onTimeChange(e.target.value) : undefined}
      />
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}
