import { type SurvivalSummary } from '../../../lib/api'
import { Text } from '../../atoms/Text/Text'
import styles from './SurvivalResults.module.scss'

interface SurvivalResultsProps {
  summary: SurvivalSummary
}

function plural(n: number, forms: [string, string, string]) {
  const m10 = n % 10
  const m100 = n % 100
  if (m100 >= 11 && m100 <= 19) return forms[2]
  if (m10 === 1) return forms[0]
  if (m10 >= 2 && m10 <= 4) return forms[1]
  return forms[2]
}

function accuracyMessage(pct: number): string {
  if (pct >= 80) return 'Легенда выживания! Ваш интеллект почти пуленепробиваем!'
  if (pct >= 60) return 'Мощное выступление! Вы уверенно держались до конца!'
  if (pct >= 40) return 'Неплохое выживание! Есть куда расти!'
  return 'Ничего, в следующий раз получится лучше! Главное — не сдаваться!'
}

export function SurvivalResults({ summary }: SurvivalResultsProps) {
  const pct = summary.totalQuestions > 0 ? Math.round((summary.correctAnswers / summary.totalQuestions) * 100) : 0
  const diffLabels: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' }

  return (
    <div className={styles.wrap}>
      <div className={styles.banner}>
        <div className={styles.icon}>🏆</div>
        <Text as="h1" variant="heading" center>Игра окончена</Text>
        <div className={styles.subtitle}>{accuracyMessage(pct)}</div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{summary.totalScore}</div>
          <div className={styles.statLabel}>Очки выживания</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{summary.maxStreak}</div>
          <div className={styles.statLabel}>Макс. стрик</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{summary.totalQuestions}</div>
          <div className={styles.statLabel}>{plural(summary.totalQuestions, ['вопрос', 'вопроса', 'вопросов'])}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{pct}%</div>
          <div className={styles.statLabel}>Точность</div>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span>Правильных ответов:</span>
          <span className={styles.green}>{summary.correctAnswers}</span>
        </div>
        <div className={styles.detailRow}>
          <span>Ошибок:</span>
          <span className={styles.red}>{summary.wrongAnswers}</span>
        </div>
        <div className={styles.detailRow}>
          <span>Достигнутая сложность:</span>
          <span>{diffLabels[summary.difficultyReached] || summary.difficultyReached}</span>
        </div>
        {summary.rank != null && (
          <div className={styles.detailRow}>
            <span>Место в лидерборде:</span>
            <span className={styles.gold}>#{summary.rank}</span>
          </div>
        )}
      </div>

      {(summary.isNewPersonalBestScore || summary.isNewPersonalBestStreak) && (
        <div className={styles.records}>
          <div className={styles.recordTitle}>🎉 Новые рекорды!</div>
          {summary.isNewPersonalBestScore && (
            <div className={styles.recordItem}>🏅 Личный рекорд по очкам: {summary.totalScore}</div>
          )}
          {summary.isNewPersonalBestStreak && (
            <div className={styles.recordItem}>🔥 Личный рекорд по стрику: {summary.maxStreak}</div>
          )}
        </div>
      )}
    </div>
  )
}
