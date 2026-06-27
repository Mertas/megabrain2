import { useState } from 'react'
import { Layout } from '../Layout/Layout'
import { AuthForm } from './AuthForm'

export default function AuthFormFixture() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login')

  return (
    <Layout activeNav="game" breadcrumbs={[{ label: mode === 'login' ? 'Вход' : mode === 'register' ? 'Регистрация' : mode === 'forgot' ? 'Восстановление' : 'Новый пароль' }]}>
      <AuthForm
        mode={mode}
        onSubmit={(d) => alert(JSON.stringify(d))}
        onSwitchMode={(m) => setMode(m as typeof mode)}
      />
    </Layout>
  )
}
