import { Component, type ReactNode } from 'react'

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
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#D9D7C2',
          fontFamily: 'Verdana, sans-serif',
          padding: 20,
        }}>
          <div style={{
            maxWidth: 500,
            width: '100%',
            background: '#FFF',
            border: '1px solid #C5C9CD',
            borderRadius: 10,
            padding: 32,
            boxShadow: '3px 3px 8px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{'\u2620'}</div>
            <h1 style={{ fontSize: 24, marginBottom: 8, color: '#0E2136' }}>Что-то пошло не так</h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
              Произошла ошибка, которую мы не предусмотрели. Такое бывает, когда код пишут по ночам.
            </p>
            <pre style={{
              background: '#182C3F',
              color: '#EDEBD2',
              padding: 12,
              borderRadius: 6,
              fontSize: 12,
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: 150,
              marginBottom: 16,
            }}>
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/'
              }}
              style={{
                border: 'none',
                background: '#F9A253',
                color: '#000',
                padding: '8px 24px',
                fontSize: 16,
                borderRadius: 4,
                cursor: 'pointer',
                fontFamily: 'Verdana, sans-serif',
              }}
            >
              На главную
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
