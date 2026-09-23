import { useState, useEffect } from 'react'
import { useNavigate, createRoute } from '@tanstack/react-router'
import { AuthForm } from '../components/organisms/AuthForm/AuthForm'
import { useToast } from '../components/molecules/ToastContainer/ToastContainer'
import { ApiError } from '../lib/api'
import { useAuth } from '../context/auth'
import { Center } from '../components/atoms/Center/Center'
import { rootRoute, PageWrap } from './base'

/* /login */
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: function LoginPage() {
    const auth = useAuth()
    const n = useNavigate()
    const [error, setError] = useState<string>()
    const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({})
    const [savedLogin, setSavedLogin] = useState('')

    const submit = async (data: { login?: string; password?: string }) => {
      setError(undefined); setFieldErrs({})
      if (data.login) setSavedLogin(data.login)
      try {
        await auth.login(data.login!, data.password!)
        n({ to: '/' })
      } catch (err) {
        if (err instanceof ApiError) { setError(err.message); for (const d of err.details) setFieldErrs((p) => ({ ...p, [d.path]: d.message })) }
        else setError((err as Error).message)
      }
    }

    return (
      <PageWrap route="login">
        <AuthForm mode="login" onSubmit={submit} initialLogin={savedLogin} error={error} fieldErrors={fieldErrs} onSwitchMode={(m) => n({ to: `/${m === 'register' ? 'register' : m === 'forgot' ? 'forgot-password' : 'login'}` as any })} />
      </PageWrap>
    )
  },
})

/* /register */
export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: function RegisterPage() {
    const auth = useAuth()
    const n = useNavigate()
    const [error, setError] = useState<string>()
    const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({})

    const submit = async (data: { login?: string; password?: string; email?: string }) => {
      setError(undefined); setFieldErrs({})
      try {
        await auth.register(data.login!, data.email!, data.password!)
        n({ to: '/' })
      } catch (err) {
        if (err instanceof ApiError) { setError(err.message); for (const d of err.details) setFieldErrs((p) => ({ ...p, [d.path]: d.message })) }
        else setError((err as Error).message)
      }
    }

    return (
      <PageWrap route="register">
        <AuthForm mode="register" onSubmit={submit} error={error} fieldErrors={fieldErrs} onSwitchMode={(m) => n({ to: `/${m === 'login' ? 'login' : 'register'}` as any })} />
      </PageWrap>
    )
  },
})

/* /forgot-password */
export const forgotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: function ForgotPage() {
    const auth = useAuth()
    const n = useNavigate()
    const { show } = useToast()
    const [error, setError] = useState<string>()
    const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({})

    const submit = async (data: { login?: string; password?: string; email?: string }) => {
      setError(undefined); setFieldErrs({})
      try {
        await auth.forgotPw(data.login!, data.email!)
        show({ variant: 'info', message: 'Ссылка для сброса отправлена.', autoHide: 3000 })
        setTimeout(() => n({ to: '/login' }), 1500)
      } catch (err) {
        if (err instanceof ApiError) { setError(err.message); for (const d of err.details) setFieldErrs((p) => ({ ...p, [d.path]: d.message })) }
        else setError((err as Error).message)
      }
    }

    return (
      <PageWrap route="forgot">
        <AuthForm mode="forgot" onSubmit={submit} error={error} fieldErrors={fieldErrs} onSwitchMode={(m) => n({ to: `/${m === 'login' ? 'login' : 'forgot-password'}` as any })} />
      </PageWrap>
    )
  },
})

/* /reset-password */
export const resetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: function ResetPage() {
    const auth = useAuth()
    const n = useNavigate()
    const { show } = useToast()
    const token = new URLSearchParams(window.location.search).get('token')
    const [valid, setValid] = useState<boolean | null>(null)
    const [error, setError] = useState<string>()
    const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({})
    const jokes = ['Эта ссылка протухла.', 'Ссылка умерла. Пароль не ждёт.', 'Время вышло!']

    useEffect(() => {
      if (!token) return
      auth.verifyToken(token).then(() => setValid(true)).catch((e) => {
        if (e instanceof ApiError && (e.status === 410 || e.status === 400)) setValid(false)
        else setError(e.message)
      })
    }, [token, auth])

    return (
      <PageWrap route="reset">
        {!token ? <Center padding={40}>Нет токена.</Center>
        : valid === null ? <Center padding={40}>Проверяем ссылку...</Center>
        : valid === false ? <Center padding={40}><h2 style={{ fontSize: 19, color: '#FF0000' }}>Ссылка протухла</h2><p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>{jokes[Math.floor(Math.random() * jokes.length)]}</p></Center>
        : <AuthForm mode="reset" onSubmit={async (d) => {
          setError(undefined); setFieldErrs({})
          try {
            await auth.resetPw(token!, d.password!)
            show({ variant: 'correct', message: 'Пароль изменён!', autoHide: 2000 })
            setTimeout(() => n({ to: '/' }), 1500)
          } catch (err) {
            if (err instanceof ApiError) { setError(err.message); for (const d of err.details) setFieldErrs((p) => ({ ...p, [d.path]: d.message })) }
            else setError((err as Error).message)
          }
        }} error={error || undefined} fieldErrors={fieldErrs} onSwitchMode={() => {}} />}
      </PageWrap>
    )
  },
})
