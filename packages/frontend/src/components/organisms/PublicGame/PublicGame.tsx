import { useState, useCallback, useEffect, useRef } from 'react'
import { AnswerGrid, type AnswerCheckResult } from '../../molecules/AnswerGrid/AnswerGrid'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Spinner } from '../../atoms/Spinner/Spinner'
import { login as apiLogin, fetchPublicQuestion, checkPublicAnswer, type PublicQuestion, ApiError, type LoginResult } from '../../../lib/api'
import styles from './PublicGame.module.scss'

export interface PublicGameProps {
  onNavigate?: (step: string) => void
  onLoginSuccess?: (result: LoginResult) => void
}

export function PublicGame({ onNavigate, onLoginSuccess }: PublicGameProps) {
  const [question, setQuestion] = useState<PublicQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [round, setRound] = useState(0)
  const [nextLoading, setNextLoading] = useState(false)
  const [checkResult, setCheckResult] = useState<(AnswerCheckResult & { explanation?: string | null }) | null>(null)
  const [loginVal, setLoginVal] = useState('')
  const [passVal, setPassVal] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginPending, setLoginPending] = useState(false)

  const hasQuestionRef = useRef(false)

  const loadQuestion = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    setLoadError('')
    setCheckResult(null)
    try {
      const q = await fetchPublicQuestion()
      hasQuestionRef.current = true
      setQuestion(q)
      setRound((r) => r + 1)
    } catch {
      if (!hasQuestionRef.current) setLoadError('Не удалось загрузить вопрос. Проверьте подключение.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadQuestion(true) }, [])

  const handleNext = useCallback(async () => {
    setNextLoading(true)
    await loadQuestion()
    setNextLoading(false)
  }, [loadQuestion])

  const handleAnswer = useCallback(async (answerText: string): Promise<AnswerCheckResult> => {
    if (!question) return { correct: false, correctAnswer: '' }
    const result = await checkPublicAnswer(question.question.id, answerText)
    setCheckResult({ correct: result.correct, correctAnswer: result.correctAnswer, explanation: result.explanation })
    return { correct: result.correct, correctAnswer: result.correctAnswer }
  }, [question])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    if (loginVal.length < 3) {
      setLoginError('Логин — не меньше 3 символов')
      return
    }
    if (passVal.length < 6) {
      setLoginError('Пароль — не меньше 6 символов')
      return
    }

    setLoginPending(true)
    try {
      const result = await apiLogin(loginVal, passVal)
      onLoginSuccess?.(result)
    } catch (err) {
      if (err instanceof ApiError) {
        setLoginError(err.message)
      } else {
        setLoginError('Не удалось войти')
      }
    }
    setLoginPending(false)
  }, [loginVal, passVal, onLoginSuccess])

  if (loading) {
    return <div className={styles.loader}><Spinner size="lg" /></div>
  }

  if (loadError && !question) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.logo} />
        <p className={styles.errorText}>{loadError}</p>
        <Button variant="primary" size="md" onClick={() => loadQuestion(true)}>
          Попробовать снова
        </Button>
      </div>
    )
  }

  if (!question) return null

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <a href="/" className={styles.logo} aria-label="megabrain — на главную" />
        <p className={styles.subtitle}>
          Вопросы на эрудицию, науку, историю, географию и другие области знаний. Играй без регистрации.
        </p>
      </div>

      <div className={styles.questionCard}>
        <div className={styles.topicBadge}>
          {question.topic.categoryName} &middot; {question.topic.name}
        </div>

        <AnswerGrid
          key={round}
          answers={question.question.answers}
          question={question.question.text}
          bordered
          onAnswer={handleAnswer}
        />

        {checkResult && (
          <div className={styles.feedback}>
            <div className={checkResult.correct ? styles.correctBadge : styles.wrongBadge}>
              {checkResult.correct ? 'Правильно!' : 'Неправильно'}
            </div>
            {checkResult.explanation && (
              <div className={styles.explanation}>{checkResult.explanation}</div>
            )}
            <Button variant="primary" size="lg" onClick={handleNext} fullWidth loading={nextLoading}>
              Следующий вопрос
            </Button>
          </div>
        )}
      </div>

      <div className={styles.loginCard}>
        <p className={styles.loginPrompt}>
          Войдите, чтобы сохранять прогресс
        </p>
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <Input
            label="Логин"
            value={loginVal}
            onChange={(e) => setLoginVal(e.target.value)}
            placeholder="megabrain_fan"
            size="lg"
            fullWidth
            hint="Ваш уникальный идентификатор в этой вселенной. Тот, что вы придумали при регистрации. Если не регистрировались — сейчас самое время."
          />
          <Input
            label="Пароль"
            type="password"
            value={passVal}
            onChange={(e) => setPassVal(e.target.value)}
            placeholder="••••••"
            size="lg"
            fullWidth
            hint="Секретная комбинация символов, которую знаете только вы. И ещё сервер, но он никому не скажет."
          />
          {loginError && <div className={styles.loginError}>{loginError}</div>}
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loginPending}>
            Войти
          </Button>
        </form>
        <div className={styles.loginLinks}>
          <a href="/register" onClick={(e) => { e.preventDefault(); onNavigate?.('register') }}>
            Зарегистрироваться
          </a>
          <a href="/forgot-password" onClick={(e) => { e.preventDefault(); onNavigate?.('forgot-password') }}>
            Забыли пароль?
          </a>
        </div>
      </div>

      <div className={styles.footer}>
        <p>&copy; <a href="http://futurico.ru">futurico</a> 2011</p>
      </div>
    </div>
  )
}
