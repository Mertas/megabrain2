import { forwardRef, useId, useEffect, useRef } from 'react'
import styles from './Checkbox.module.scss'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label: string
  labelPosition?: 'left' | 'right'
  indeterminate?: boolean
  size?: 'sm' | 'md'
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, labelPosition = 'right', indeterminate = false, size = 'md', className, id: extId, ...rest }, ref) => {
    const autoId = useId()
    const id = extId || autoId
    const innerRef = useRef<HTMLInputElement | null>(null)

    const syncRef = (node: HTMLInputElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate
      }
    }, [indeterminate])

    const wrapperCls = [styles.wrapper, styles[size], className].filter(Boolean).join(' ')

    return (
      <label className={wrapperCls}>
        {labelPosition === 'left' && <span className={styles.label}>{label}</span>}
        <input ref={syncRef} id={id} type="checkbox" className={styles.input} {...rest} />
        <span className={styles.box} aria-hidden="true" />
        {labelPosition === 'right' && <span className={styles.label}>{label}</span>}
      </label>
    )
  },
)

Checkbox.displayName = 'Checkbox'
