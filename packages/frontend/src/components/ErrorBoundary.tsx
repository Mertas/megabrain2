import { Component, type ReactNode } from 'react'
import styles from './ErrorBoundary.module.scss'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.overlay}>
          <div className={styles.box}>
            <div className={styles.skull}>{'\u2620'}</div>
            <h1 className={styles.title}>Что-то пошло не так</h1>
            <p className={styles.text}>
              Произошла ошибка, которую мы не предусмотрели. Такое бывает, когда код пишут по ночам.
            </p>
            <pre className={styles.pre}>
              {this.state.error?.message}
            </pre>
            <button className={styles.btn} onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.href = '/'
            }}>
              На главную
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
