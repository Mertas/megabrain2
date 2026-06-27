import { useState, useCallback, useEffect, useMemo } from 'react'
import { TooltipProvider } from './components/atoms/Tooltip/Tooltip'
import { Layout } from './components/organisms/Layout/Layout'
import { AuthForm } from './components/organisms/AuthForm/AuthForm'
import { NewGameForm, type GameConfig } from './components/organisms/NewGameForm/NewGameForm'
import { GameBoard, type Question, type GameResult } from './components/organisms/GameBoard/GameBoard'
import { GameResults } from './components/organisms/GameResults/GameResults'
import { AddQuestions } from './components/organisms/AddQuestions/AddQuestions'
import { Button } from './components/atoms/Button/Button'
import { useToast } from './components/molecules/ToastContainer/ToastContainer'
import {
  login as apiLogin, register as apiRegister, logout as apiLogout,
  getStoredUser, forgotPassword, verifyResetToken, resetPassword,
  fetchCategories, fetchQuestions, type UserPublic, ApiError,
  type ApiCategory, type ApiTopic,
} from './lib/api'

type AppStep = 'setup' | 'playing' | 'results' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'add-questions'

const stepToPath: Record<AppStep, string> = {
  setup: '/',
  playing: '/game',
  results: '/results',
  login: '/login',
  register: '/register',
  'forgot-password': '/forgot-password',
  'reset-password': '/reset-password',
  'add-questions': '/questions/add',
}

const pathToStep: Record<string, AppStep> = {
  '/': 'setup',
  '/game': 'playing',
  '/results': 'results',
  '/login': 'login',
  '/register': 'register',
  '/forgot-password': 'forgot-password',
  '/questions/add': 'add-questions',
}

const AUTH_STEPS: AppStep[] = ['login', 'register', 'forgot-password', 'reset-password']
const PROTECTED_STEPS: AppStep[] = ['add-questions']

function getStepFromPath(): AppStep {
  if (window.location.pathname === '/reset-password') return 'reset-password'
  return pathToStep[window.location.pathname] || 'setup'
}

function getReturnUrl(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('returnUrl') || '/'
}

const expiredJokes = [
  'Эта ссылка протухла. Её время истекло ровно в тот момент, когда вы на неё нажали. Совпадение? Не думаем.',
  'Ссылка умерла. Пароль не ждёт. Как майонез на солнцепёке — испортился и уже не спасёшь.',
  'Время вышло! Эта ссылка испортилась быстрее, чем молоко в июле. Попробуйте заново.',
]

function App() {
  const [step, setStep] = useState<AppStep>(getStepFromPath)
  const [user, setUser] = useState<UserPublic | null>(getStoredUser())
  const [questions, setQuestions] = useState<Question[]>([])
  const [result, setResult] = useState<GameResult | null>(null)
  const [authError, setAuthError] = useState<string>()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [savedLogin, setSavedLogin] = useState('')
  const [resetTokenValid, setResetTokenValid] = useState<boolean | null>(null)
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [topics, setTopics] = useState<ApiTopic[]>([])
  const { show, toasts, remove, ToastContainer } = useToast()

  const isLoggedIn = !!user
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token'), [])

  useEffect(() => { fetchCategories().then((cats) => { setCategories(cats); setTopics(cats.flatMap((c) => c.topics)) }) }, [])

  const navigate = useCallback((s: string, extra?: Record<string, string>) => {
    setStep(s as AppStep)
    let path = stepToPath[s as AppStep] || '/'
    if (s === 'reset-password' && token) path = `/reset-password?token=${token}`
    if (extra) {
      const p = new URLSearchParams(extra)
      path += `?${p.toString()}`
    }
    window.history.pushState(null, '', path)
  }, [token])

  useEffect(() => {
    const onPopState = () => setStep(getStepFromPath())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Auth guard: redirect protected pages to login
  useEffect(() => {
    if (PROTECTED_STEPS.includes(step) && !isLoggedIn) {
      navigate('login', { returnUrl: window.location.pathname + window.location.search })
    }
  }, [step, isLoggedIn, navigate])

  // Redirect auth pages for logged-in users
  useEffect(() => {
    if (AUTH_STEPS.includes(step) && isLoggedIn) {
      navigate('setup')
    }
  }, [step, isLoggedIn, navigate])

  // Verify reset token
  useEffect(() => {
    if (step !== 'reset-password' || !token) return
    verifyResetToken(token)
      .then(() => { setResetTokenValid(true) })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 410 || err.status === 400)) setResetTokenValid(false)
        else setAuthError(err.message)
      })
  }, [step, token])

  const setAuth = useCallback((err: unknown) => {
    if (err instanceof ApiError) {
      setAuthError(err.message)
      for (const d of err.details) setFieldErrors((prev) => ({ ...prev, [d.path]: d.message }))
    } else {
      setAuthError((err as Error).message)
    }
  }, [])

  const goAfterAuth = useCallback(() => {
    const returnUrl = getReturnUrl()
    if (returnUrl && returnUrl !== '/') {
      window.history.pushState(null, '', returnUrl)
      setStep(getStepFromPath())
    } else {
      navigate('setup')
    }
  }, [navigate])

  const handleStart = useCallback(async (config: GameConfig) => {
    const qs = await fetchQuestions(config.subtopicIds, config.questionCount, true)
    setQuestions(qs.map((q) => ({
      id: q.id,
      text: q.text, imageUrl: q.image_url || undefined,
      answers: q.answers, correctIndex: -1,
      note: q.note || undefined,
    })))
    navigate('playing')
  }, [navigate])

  const handleFinish = useCallback((r: GameResult) => { setResult(r); navigate('results') }, [navigate])
  const handleBackToSetup = useCallback(() => { setQuestions([]); setResult(null); navigate('setup') }, [navigate])

  const handleLogin = useCallback(async (data: { login?: string; password?: string }) => {
    setAuthError(undefined); setFieldErrors({})
    if (data.login) setSavedLogin(data.login)
    try { const r = await apiLogin(data.login!, data.password!); setUser(r.user); goAfterAuth() } catch (err) { setAuth(err) }
  }, [setAuth, goAfterAuth])

  const handleRegister = useCallback(async (data: { login?: string; password?: string; email?: string }) => {
    setAuthError(undefined); setFieldErrors({})
    try {
      await apiRegister(data.login!, data.email!, data.password!)
      const r = await apiLogin(data.login!, data.password!); setUser(r.user); goAfterAuth()
    } catch (err) { setAuth(err) }
  }, [setAuth, goAfterAuth])

  const handleForgotPassword = useCallback(async (data: { login?: string; password?: string; email?: string }) => {
    setAuthError(undefined); setFieldErrors({})
    try {
      await forgotPassword(data.login!, data.email!)
      show({ variant: 'info', message: 'Ссылка для сброса отправлена. Проверьте консоль сервера.', autoHide: 3000 })
      setTimeout(() => navigate('login'), 1500)
    } catch (err) { setAuth(err) }
  }, [setAuth, show, navigate])

  const handleResetPassword = useCallback(async (data: { password?: string }) => {
    setAuthError(undefined); setFieldErrors({})
    try {
      const result = await resetPassword(token!, data.password!)
      setUser(result.user)
      show({ variant: 'correct', message: 'Пароль успешно изменён!', autoHide: 2000 })
      setTimeout(() => goAfterAuth(), 1500)
    } catch (err) { setAuth(err) }
  }, [token, setAuth, show, goAfterAuth])

  const handleLogout = useCallback(() => { apiLogout(); setUser(null); navigate('setup') }, [navigate])

  const handleSwitchMode = useCallback((mode: string) => {
    setAuthError(undefined); setFieldErrors({})
    const s = mode === 'forgot' ? 'forgot-password' : mode === 'reset' ? 'reset-password' : mode
    navigate(s)
  }, [navigate])

  const authProps = { error: authError, fieldErrors, onSwitchMode: handleSwitchMode }

  return (
    <TooltipProvider>
      <ToastContainer toasts={toasts} onRemove={remove} />

      {(step === 'login' || step === 'register' || step === 'forgot-password') && (
        <Layout
          activeNav="game"
          breadcrumbs={[{ label: step === 'login' ? 'Вход' : step === 'register' ? 'Регистрация' : 'Восстановление пароля' }]}
          isLoggedIn={false}
          onNavigate={navigate}
        >
          <AuthForm
            mode={step === 'forgot-password' ? 'forgot' : step as 'login' | 'register'}
            onSubmit={step === 'login' ? handleLogin : step === 'register' ? handleRegister : handleForgotPassword}
            initialLogin={savedLogin}
            {...authProps}
          />
        </Layout>
      )}

      {step === 'reset-password' && (
        <Layout activeNav="game" breadcrumbs={[{ label: 'Новый пароль' }]} isLoggedIn={false} onNavigate={navigate}>
          {resetTokenValid === null ? (
            <div style={{ textAlign: 'center', padding: 40, fontSize: 14 }}>Проверяем ссылку...</div>
          ) : resetTokenValid === false ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <h2 style={{ fontSize: 19, marginBottom: 12, color: '#FF0000' }}>Ссылка протухла</h2>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>
                {expiredJokes[Math.floor(Math.random() * expiredJokes.length)]}
              </p>
              <Button variant="primary" size="sm" onClick={() => navigate('forgot-password')}>Восстановить заново</Button>
            </div>
          ) : (
            <AuthForm mode="reset" onSubmit={handleResetPassword} {...authProps} />
          )}
        </Layout>
      )}

      {step === 'add-questions' && isLoggedIn && (
        <Layout activeNav="questions" breadcrumbs={[{ label: 'Вопросы' }, { label: 'Добавить' }]} isLoggedIn nickname={user?.nickname} onNavigate={navigate} onLogout={handleLogout}>
          <AddQuestions categories={categories} topics={topics} />
        </Layout>
      )}

      {step === 'setup' && (
        <Layout activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Новая игра' }]} isLoggedIn={isLoggedIn} nickname={user?.nickname} onNavigate={navigate} onLogout={handleLogout}>
          <NewGameForm categories={categories} onStart={handleStart} />
        </Layout>
      )}

      {step === 'playing' && (
        <Layout activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Астрономия' }]} isLoggedIn={isLoggedIn} nickname={user?.nickname} onNavigate={navigate} onLogout={handleLogout}>
          <GameBoard questions={questions} onFinish={handleFinish} />
        </Layout>
      )}

      {step === 'results' && (
        result ? (
        <Layout activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Результаты' }]} isLoggedIn={isLoggedIn} nickname={user?.nickname} onNavigate={navigate} onLogout={handleLogout}>
          <GameResults result={result} />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button variant="link" size="sm" onClick={handleBackToSetup}>Новая игра</Button>
          </div>
        </Layout>
        ) : (
        <Layout activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Результаты' }]} isLoggedIn={isLoggedIn} nickname={user?.nickname} onNavigate={navigate} onLogout={handleLogout}>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <h2 style={{ fontSize: 19, marginBottom: 12 }}>Нет данных</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Здесь будут результаты после игры.</p>
            <Button variant="primary" size="sm" onClick={handleBackToSetup}>Начать игру</Button>
          </div>
        </Layout>
        )
      )}
    </TooltipProvider>
  )
}

export default App
