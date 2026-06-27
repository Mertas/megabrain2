import { forwardRef, useId, useState } from 'react'
import styles from './FileInput.module.scss'

export interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'value' | 'onChange'> {
  label?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  /** Принимаемые типы файлов (accept) */
  accept?: string
  /** Текст кнопки выбора */
  buttonText?: string
  /** Выбранный файл */
  value?: File | null
  onChange?: (file: File | null) => void
}

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      label,
      hint,
      error,
      size = 'md',
      fullWidth = false,
      accept,
      buttonText = 'Выбрать файл',
      value,
      onChange,
      className,
      id: extId,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId()
    const id = extId || autoId
    const [internalFile, setInternalFile] = useState<File | null>(null)
    const file = value !== undefined ? value : internalFile

    const wrapperCls = [styles.wrapper, fullWidth && styles.fullWidth, styles[size], className]
      .filter(Boolean)
      .join(' ')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null
      if (value === undefined) setInternalFile(f)
      onChange?.(f)
    }

    return (
      <div className={wrapperCls}>
        {label && (
          <label htmlFor={id} className={styles.label}>{label}</label>
        )}
        <div className={styles.row}>
          <label className={styles.button}>
            {buttonText}
            <input
              ref={ref}
              id={id}
              type="file"
              accept={accept}
              className={styles.input}
              onChange={handleChange}
              aria-invalid={error ? 'true' : undefined}
              {...rest}
            />
          </label>
          <span className={`${styles.name} ${file ? styles.hasFile : ''}`}>
            {file ? file.name : 'Файл не выбран'}
          </span>
        </div>
        {hint && !error && <span className={styles.hint}>{hint}</span>}
        {error && <span className={styles.errorText} role="alert">{error}</span>}
      </div>
    )
  },
)

FileInput.displayName = 'FileInput'
