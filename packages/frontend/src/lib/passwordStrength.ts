import zxcvbn from 'zxcvbn'

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  color: string
  feedback: string
}

const levels: Omit<PasswordStrength, 'score'>[] = [
  { label: 'Очень слабый', color: '#FF0000', feedback: 'Пароль легко угадать.' },
  { label: 'Слабый', color: '#FF6633', feedback: 'Слишком простой пароль.' },
  { label: 'Средний', color: '#F9A253', feedback: 'Можно лучше.' },
  { label: 'Хороший', color: '#37CE74', feedback: 'Неплохой пароль.' },
  { label: 'Отличный', color: '#00AA00', feedback: 'Надёжный пароль.' },
]

export function checkPassword(password: string): PasswordStrength | null {
  if (password.length < 6) return null
  const result = zxcvbn(password)
  const level = levels[result.score]
  return { score: result.score as PasswordStrength['score'], ...level }
}
