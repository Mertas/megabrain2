import { forwardRef, useId } from 'react'
import styles from './Input.module.scss'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  iconLeft?: string
  iconRight?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      size = 'md',
      fullWidth = false,
      iconLeft,
      iconRight,
      className,
      id: extId,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId()
    const id = extId || autoId

    const inputCls = [
      styles.input,
      styles[size],
      error && styles.error,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {iconLeft && <span className={`${styles.icon} ${styles.iconLeft}`}>{iconLeft}</span>}
          <input
            ref={ref}
            id={id}
            className={inputCls}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...rest}
          />
          {iconRight && <span className={`${styles.icon} ${styles.iconRight}`}>{iconRight}</span>}
        </div>
        {hint && !error && (
          <span id={`${id}-hint`} className={styles.hint}>{hint}</span>
        )}
        {error && (
          <span id={`${id}-error`} className={styles.errorText} role="alert">{error}</span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
