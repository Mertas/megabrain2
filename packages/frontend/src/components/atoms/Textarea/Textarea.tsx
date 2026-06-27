import { forwardRef, useLayoutEffect, useRef, useId } from 'react'
import styles from './Textarea.module.scss'

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  autoResize?: boolean
  minRows?: number
  maxRows?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      size = 'md',
      fullWidth = false,
      autoResize = false,
      minRows = 2,
      maxRows = 10,
      className,
      id: extId,
      onChange,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId()
    const id = extId || autoId
    const innerRef = useRef<HTMLTextAreaElement | null>(null)

    const syncRef = (node: HTMLTextAreaElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    useLayoutEffect(() => {
      if (!autoResize || !innerRef.current) return
      const el = innerRef.current
      el.style.height = 'auto'
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20
      const minH = minRows * lineHeight
      const maxH = maxRows * lineHeight
      const scrollH = el.scrollHeight
      el.style.height = `${Math.min(Math.max(scrollH, minH), maxH)}px`
    }, [autoResize, minRows, maxRows, rest.value])

    const taCls = [
      styles.textarea,
      styles[size],
      error && styles.error,
      autoResize && styles.noResize,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!autoResize || !innerRef.current) return
      const el = innerRef.current
      el.style.height = 'auto'
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20
      const minH = minRows * lineHeight
      const maxH = maxRows * lineHeight
      const scrollH = el.scrollHeight
      el.style.height = `${Math.min(Math.max(scrollH, minH), maxH)}px`
      onChange?.(e)
    }

    return (
      <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`}>
        {label && (
          <label htmlFor={id} className={styles.label}>{label}</label>
        )}
        <textarea
          ref={syncRef}
          id={id}
          className={taCls}
          rows={minRows}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          onChange={autoResize ? handleChange : onChange}
          {...rest}
        />
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

Textarea.displayName = 'Textarea'
