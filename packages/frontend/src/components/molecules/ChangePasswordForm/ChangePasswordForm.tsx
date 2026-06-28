import { useState } from 'react'
import { Input } from '../../atoms/Input/Input'
import { Button } from '../../atoms/Button/Button'
import { changePassword, ApiError } from '../../../lib/api'
import styles from './ChangePasswordForm.module.scss'

export function ChangePasswordForm() {
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPw.length < 6) {
      setError('Новый пароль — не меньше 6 символов')
      return
    }

    setPending(true)
    try {
      await changePassword(oldPw, newPw)
      setSuccess(true)
      setOldPw('')
      setNewPw('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сменить пароль')
    }
    setPending(false)
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Сменить пароль</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Текущий пароль"
          type="password"
          value={oldPw}
          onChange={(e) => setOldPw(e.target.value)}
          size="lg"
          fullWidth
          hint="Иногда мы забываем, какой у нас пароль. Если вы помните — отлично. Если нет — мы, к сожалению, тоже не помним."
        />
        <Input
          label="Новый пароль"
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          size="lg"
          fullWidth
          hint="Не меньше 6 символов. Мы проверим его надёжность, чтобы вы не переживали. Ну, хотя бы постараемся."
        />
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>Пароль успешно изменён</div>}
        <Button type="submit" variant="primary" size="md" loading={pending}>
          Сменить пароль
        </Button>
      </form>
    </div>
  )
}
