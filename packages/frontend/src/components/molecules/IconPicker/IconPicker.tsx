import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './IconPicker.module.scss'

export interface IconPickerProps {
  value: string
  icons: string[]
  onChange: (icon: string) => void
}

export function IconPicker({ value, icons, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)

  const handleSelect = useCallback((icon: string) => {
    onChange(icon)
    setOpen(false)
  }, [onChange])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <span className={styles.picker} ref={wrapperRef}>
      <button
        type="button"
        className={styles.current}
        onClick={() => setOpen(!open)}
        aria-label="Выбрать иконку уровня"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {value}
      </button>
      {open && (
        <span className={styles.grid} role="listbox" aria-label="Доступные иконки">
          {icons.map((icon) => (
            <button
              key={icon}
              type="button"
              role="option"
              className={`${styles.option} ${icon === value ? styles.selected : ''}`}
              aria-selected={icon === value}
              aria-label={`Иконка ${icon}`}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(icon) }}
            >
              {icon}
            </button>
          ))}
        </span>
      )}
    </span>
  )
}
