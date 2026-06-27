import { useState } from 'react'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Select } from '../../atoms/Select/Select'
import styles from './InlineEdit.module.scss'

export interface InlineEditProps {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  label?: string
  /** Тип поля редактирования */
  editType?: 'text' | 'textarea' | 'select' | 'password'
  options?: { value: string; label: string }[]
}

export function InlineEdit({ value, onSave, placeholder = '—', label, editType = 'text', options }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const handleSave = () => {
    onSave(draft)
    setEditing(false)
  }

  const inputLabel = label || 'Редактировать'

  if (!editing) {
    return (
      <div className={styles.display}>
        <span className={styles.text}>{value || placeholder}</span>
        <Button variant="ghost" size="sm" onClick={() => { setDraft(value); setEditing(true) }}>
          изменить
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.edit}>
      {editType === 'select' && options ? (
        <Select
          label={inputLabel}
          options={options}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          size="sm"
        />
      ) : (
        <Input
          label={inputLabel}
          type={editType === 'password' ? 'password' : 'text'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            else if (e.key === 'Escape') setEditing(false)
          }}
          autoFocus
          size="sm"
        />
      )}
      <div className={styles.actions}>
        <Button variant="primary" size="sm" onClick={handleSave}>Сохранить</Button>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Отмена</Button>
      </div>
    </div>
  )
}
