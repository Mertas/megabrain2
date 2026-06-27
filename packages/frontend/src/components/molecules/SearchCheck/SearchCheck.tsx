import styles from './SearchCheck.module.scss'

export interface SearchCheckProps {
  questionText: string
}

const searchUrl = (engine: 'google' | 'yandex', q: string) => {
  const encoded = encodeURIComponent(q)
  return engine === 'google'
    ? `https://www.google.com/search?q=${encoded}`
    : `https://yandex.ru/yandsearch?text=${encoded}`
}

export function SearchCheck({ questionText }: SearchCheckProps) {
  return (
    <div className={styles.check}>
      Западня для новичка&nbsp;&mdash; знает ли об этом{' '}
      <a href={searchUrl('google', questionText)} target="_blank" rel="noopener noreferrer">Google</a>
      {' '}или{' '}
      <a href={searchUrl('yandex', questionText)} target="_blank" rel="noopener noreferrer">Yandex</a>
    </div>
  )
}
