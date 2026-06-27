import { useState } from 'react'
import { Input } from '../../atoms/Input/Input'
import { Button } from '../../atoms/Button/Button'
import styles from './SearchForm.module.scss'

export interface SearchFormProps {
  placeholder?: string
  buttonText?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (query: string) => void
}

export function SearchForm({ placeholder = 'Подобрать по ключевым словам', buttonText = 'Найти', value: controlledValue, onChange, onSearch }: SearchFormProps) {
  const [internalValue, setInternalValue] = useState('')
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (!isControlled) setInternalValue(v)
    onChange?.(v)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(value)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        className={styles.query}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      <Button type="submit" variant="secondary" className={styles.submit}>
        {buttonText}
      </Button>
    </form>
  )
}
