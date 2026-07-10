import { useState, useMemo } from 'react'
import { Input } from '../../atoms/Input/Input'
import { Button } from '../../atoms/Button/Button'
import { Tooltip } from '../../atoms/Tooltip/Tooltip'
import { checkPassword } from '../../../lib/passwordStrength'
import { StrengthBar } from '../../molecules/StrengthBar/StrengthBar'
import styles from './AuthForm.module.scss'

type AuthMode = 'login' | 'register' | 'forgot' | 'reset'

export interface AuthFormProps {
  mode: AuthMode
  onSubmit: (data: { login?: string; password?: string; email?: string }) => void
  onSwitchMode: (mode: AuthMode) => void
  error?: string
  fieldErrors?: Record<string, string>
  initialLogin?: string
}

const loginMin = 3
const passMin = 6
const passMax = 100

export function AuthForm({ mode, onSubmit, onSwitchMode, error, fieldErrors = {}, initialLogin = '' }: AuthFormProps) {
  const [login, setLogin] = useState(initialLogin)
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  const strength = useMemo(() => checkPassword(password), [password])
  const allErrors = { ...clientErrors, ...fieldErrors }
  const needsPassword = mode !== 'forgot'
  const needsLogin = mode !== 'reset'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (needsLogin && login.length < loginMin) errs.login = `Логин должен быть не короче ${loginMin} символов`
    if (needsPassword && password.length < passMin) errs.password = `Пароль должен быть не короче ${passMin} символов`
    if ((mode === 'register' || mode === 'forgot') && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Введите корректный email'
    setClientErrors(errs)
    if (Object.keys(errs).length > 0) return

    const data: Record<string, string> = {}
    if (needsLogin) data.login = login
    if (needsPassword) data.password = password
    if (mode === 'register' || mode === 'forgot') data.email = email
    onSubmit(data)
  }

  const clearField = (field: string) => setClientErrors((prev) => { const n = { ...prev }; delete n[field]; return n })

  const title = mode === 'login' ? 'Вход' : mode === 'register' ? 'Регистрация' : mode === 'forgot' ? 'Восстановление пароля' : 'Новый пароль'
  const btnText = mode === 'login' ? 'Войти' : mode === 'register' ? 'Зарегистрироваться' : mode === 'forgot' ? 'Отправить' : 'Сохранить пароль'

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>

        {mode === 'forgot' && (
          <p className={styles.desc}>Введите логин, и мы отправим ссылку для сброса пароля.</p>
        )}
        {mode === 'reset' && (
          <p className={styles.desc}>Придумайте новый пароль. Надёжный, чтобы не пришлось сбрасывать снова.</p>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {needsLogin && (
            <Input
              label="Логин"
              value={login}
              onChange={(e) => { setLogin(e.target.value); clearField('login') }}
              placeholder="Введите логин"
              error={allErrors.login}
              fullWidth size="lg"
              data-testid="auth-login"
              hint={mode === 'register' ? 'Не меньше трёх символов. Исключительно больше.' : mode === 'forgot' ? 'Логин, который вы указывали при регистрации.' : 'Ваш логин — вы с ним регистрировались, он везде у вас выводится.'}
            />
          )}
          {mode === 'register' && (
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearField('email') }}
              placeholder="Введите email"
              error={allErrors.email}
              fullWidth size="lg"
              data-testid="auth-email"
              hint="Есть старая система для восстановления доступа: вы вводите сейчаc почту, а если вдруг забудете пароль, то мы дальше через эту почту всё и вернём."
            />
          )}
          {mode === 'forgot' && (
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearField('email') }}
              placeholder="Введите email, указанный при регистрации"
              error={allErrors.email}
              fullWidth
              size="lg"
              hint="Нужен для проверки, что это действительно вы."
            />
          )}
          {mode === 'register' ? (
            <Tooltip
              text={`От ${passMin} до ${passMax} символов`}
              trigger="hover"
              position="left"
              delay={200}
              fullWidth
            >
              <div className={styles.inputWrap}>
                <Input
                  label="Пароль"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearField('password') }}
                  placeholder="Введите пароль"
                  error={allErrors.password}
                  fullWidth size="lg"
                  data-testid="auth-password"
                  hint="Как обычно, у нас есть правила по паролям. Длина там, сложность, ну, мы подскажем, если что."
                />
                {strength && <StrengthBar strength={strength} />}
              </div>
            </Tooltip>
          ) : needsPassword ? (
            <div>
              <Input
                label={mode === 'reset' ? 'Новый пароль' : 'Пароль'}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearField('password') }}
                placeholder="Введите пароль"
                error={allErrors.password}
                fullWidth size="lg"
                data-testid="auth-password"
                hint={mode === 'reset' ? 'Придумайте что-нибудь посложнее, чем «123456».' : 'Если забыли, есть кнопка внизу.'}
              />
              {strength && mode === 'reset' && <StrengthBar strength={strength} />}
            </div>
          ) : null}
          {error && !Object.keys(fieldErrors).length && (
            <div className={styles.error}>{error}</div>
          )}
          <Button type="submit" variant="primary" fullWidth size="lg" data-testid="auth-submit">
            {btnText}
          </Button>
        </form>

        <div className={styles.switch}>
          {mode === 'login' && (
            <>
              <Button variant="link" size="sm" onClick={() => onSwitchMode('register')}>
                Нет аккаунта? Зарегистрироваться
              </Button>
              <br />
              <Button variant="link" size="sm" onClick={() => onSwitchMode('forgot')}>
                Забыли пароль?
              </Button>
            </>
          )}
          {mode === 'register' && (
            <Button variant="link" size="sm" onClick={() => onSwitchMode('login')}>
              Уже есть аккаунт? Войти
            </Button>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <Button variant="link" size="sm" onClick={() => onSwitchMode('login')}>
              ← Назад ко входу
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
