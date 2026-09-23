import { useState, useEffect } from 'react'
import { fetchSurvivalLeaderboard, type SurvivalLeaderboardResult } from '../../../lib/api'
import styles from './SurvivalLeaderboard.module.scss'
import { PageHeader } from '../../molecules/PageHeader/PageHeader'

export function SurvivalLeaderboard() {
  const [period, setPeriod] = useState<'all' | 'weekly' | 'daily'>('all')
  const [data, setData] = useState<SurvivalLeaderboardResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchSurvivalLeaderboard(period).then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [period])

  const periods: { value: 'all' | 'weekly' | 'daily'; label: string }[] = [
    { value: 'all', label: 'Всё время' },
    { value: 'weekly', label: 'Неделя' },
    { value: 'daily', label: 'День' },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <PageHeader icon={'\u{1F3C6}'} title="Таблица лидеров — Выживание" />
        <div className={styles.tabs}>
          {periods.map((p) => (
            <button
              key={p.value}
              className={`${styles.tab} ${period === p.value ? styles.tabActive : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {data?.userRank && (
        <div className={styles.myRank}>
          Ваше место: <strong>#{data.userRank.rank}</strong> (счёт: {data.userRank.score})
        </div>
      )}

      {loading ? (
        <p className={styles.loading}>Загрузка...</p>
      ) : !data || data.entries.length === 0 ? (
        <p className={styles.empty}>Нет записей за этот период. Сыграйте первую игру!</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Игрок</th>
                <th>Счёт</th>
                <th>Макс. стрик</th>
                <th>Вопросов</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry) => (
                <tr key={`${entry.userId}-${entry.rank}`} className={entry.rank <= 3 ? styles.topRow : ''}>
                  <td className={styles.rank}>
                    {entry.rank === 1 ? '\u{1F947}' : entry.rank === 2 ? '\u{1F948}' : entry.rank === 3 ? '\u{1F949}' : entry.rank}
                  </td>
                  <td className={styles.nickname}>{entry.nickname}</td>
                  <td className={styles.score}>{entry.score}</td>
                  <td>{entry.maxStreak}</td>
                  <td>{entry.totalQuestions}</td>
                  <td className={styles.date}>{formatDate(entry.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  } catch {
    return dateStr
  }
}
