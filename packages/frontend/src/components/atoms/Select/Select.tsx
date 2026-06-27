import { forwardRef, useId } from 'react'
import styles from './Select.module.scss'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      error,
      size = 'md',
      fullWidth = false,
      options,
      placeholder,
      className,
      id: extId,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId()
    const id = extId || autoId

    const selCls = [styles.select, styles[size], error && styles.error, className]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`}>
        {label && (
          <label htmlFor={id} className={styles.label}>{label}</label>
        )}
        <select
          ref={ref}
          id={id}
          className={selCls}
          aria-invalid={error ? 'true' : undefined}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error && (
          <span className={styles.hint}>{hint}</span>
        )}
        {error && (
          <span className={styles.errorText} role="alert">{error}</span>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
