import { useState, useMemo } from 'react'
import { Button } from '../../atoms/Button/Button'
import { PageHeader } from '../../molecules/PageHeader/PageHeader'
import { ConfigCard } from '../../molecules/ConfigCard/ConfigCard'
import { TopicList } from '../TopicList/TopicList'
import type { Topic } from '../../molecules/TopicCard/TopicCard'
import type { ApiCategory } from '../../../lib/api'
import styles from './SurvivalSetup.module.scss'

interface SurvivalSetupProps {
  categories: ApiCategory[]
  bestScore: number
  bestStreak: number
  onStart: (topicIds: number[]) => void
  onViewLeaderboard: () => void
}

const survivalRules = [
  { icon: '\u2665', text: 'Начало: 3 жизни, 30 секунд на вопрос' },
  { icon: '\u23F1', text: 'Время убывает: −0.5 сек за правильный ответ (мин. 5 сек)' },
  { icon: '\u{1F525}', text: 'Стрик даёт множитель очков (каждые 5 подряд +0.25×, до ×3)' },
  { icon: '\u2665', text: '+1 жизнь каждые 50 верных ответов подряд (макс. 5 жизней)' },
  { icon: '\u{1F5FA}', text: 'Сложность растёт: подключаются смежные и все темы' },
]

export function SurvivalSetup({ categories, bestScore, bestStreak, onStart, onViewLeaderboard }: SurvivalSetupProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [error, setError] = useState('')

  const topics: Topic[] = useMemo(() => categories.map((cat) => ({
    id: cat.id, name: cat.name, icon: cat.icon,
    subtopics: cat.topics.map((t) => ({ id: t.id, name: t.name })),
  })), [categories])

  const handleSelectAll = (topicId: number) => {
    const topic = topics.find((t) => t.id === topicId)!
    const ids = topic.subtopics.map((s) => s.id)
    const allSelected = ids.every((id) => selectedIds.includes(id))
    setSelectedIds((prev) => allSelected ? prev.filter((x) => !ids.includes(x)) : [...new Set([...prev, ...ids])])
    setError('')
  }

  const handleStart = () => {
    if (selectedIds.length === 0) { setError('Выберите хотя бы одну тему'); return }
    onStart(selectedIds)
  }

  const totalQ = categories.reduce((sum, cat) => sum + cat.topics.reduce((s, t) => s + t.question_count, 0), 0)

  return (
    <div className={styles.wrap}>
      <PageHeader
        icon={'\u{1F480}'}
        title="Режим выживания"
        description="Бесконечный поток вопросов. Три жизни. Одна ошибка — минус жизнь. Сложность растёт с каждым верным ответом. Продержитесь как можно дольше!"
        rules={survivalRules}
      />

      <TopicList
        topics={topics}
        selectedIds={selectedIds}
        onSelectSubtopic={(id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
        onSelectAll={handleSelectAll}
        totalQuestions={totalQ}
      />

      <ConfigCard>
        {(bestScore > 0 || bestStreak > 0) && (
          <div className={styles.records}>
            {bestScore > 0 && <div className={styles.recordBadge}><span className={styles.recordLabel}>Рекордный счёт:</span><span className={styles.recordValue}>{bestScore}</span></div>}
            {bestStreak > 0 && <div className={styles.recordBadge}><span className={styles.recordLabel}>Рекордный стрик:</span><span className={styles.recordValue}>{bestStreak}</span></div>}
          </div>
        )}
      </ConfigCard>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button variant="primary" size="lg" onClick={handleStart} disabled={selectedIds.length === 0}>Начать выживание</Button>
        <Button variant="link" size="sm" onClick={onViewLeaderboard}>{'\u{1F3C6}'} Таблица лидеров</Button>
      </div>
    </div>
  )
}
