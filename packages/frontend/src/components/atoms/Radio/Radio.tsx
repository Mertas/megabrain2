import { forwardRef, useId } from 'react'
import styles from './Radio.module.scss'

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label: string
  labelPosition?: 'left' | 'right'
  size?: 'sm' | 'md'
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, labelPosition = 'right', size = 'md', className, id: extId, ...rest }, ref) => {
    const autoId = useId()
    const id = extId || autoId

    const wrapperCls = [styles.wrapper, styles[size], className].filter(Boolean).join(' ')

    return (
      <label className={wrapperCls}>
        {labelPosition === 'left' && <span className={styles.label}>{label}</span>}
        <input ref={ref} id={id} type="radio" className={styles.input} {...rest} />
        <span className={styles.circle} aria-hidden="true" />
        {labelPosition === 'right' && <span className={styles.label}>{label}</span>}
      </label>
    )
  },
)

Radio.displayName = 'Radio'
