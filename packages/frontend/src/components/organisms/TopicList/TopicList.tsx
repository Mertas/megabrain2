import { useState } from 'react'
import { SearchForm } from '../../molecules/SearchForm/SearchForm'
import { TopicCard, type Topic } from '../../molecules/TopicCard/TopicCard'
import styles from './TopicList.module.scss'

export interface TopicListProps {
  topics: Topic[]
  selectedIds: number[]
  mode?: 'select' | 'modal'
  onSelectSubtopic: (id: number) => void
  onSelectAll: (topicId: number) => void
  onClose?: () => void
  totalQuestions?: number
}

export function TopicList({ topics, selectedIds, mode = 'select', onSelectSubtopic, onSelectAll, onClose, totalQuestions }: TopicListProps) {
  const [limits, setLimits] = useState<Record<number, number>>({})

  const handleShowAll = (topicId: number) => {
    const topic = topics.find((t) => t.id === topicId)
    if (topic) setLimits((prev) => ({ ...prev, [topicId]: topic.subtopics.length }))
  }

  return (
    <div className={mode === 'modal' ? 'b-topics_list' : ''}>
      {mode === 'modal' && onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{ position: 'absolute', top: 5, right: 5, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, borderBottom: '1px dotted' }}
        >
          {'\u2716'} закрыть
        </button>
      )}
      <SearchForm />
      <div className={styles.grid}>
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            mode="select"
            selectedIds={selectedIds}
            visibleLimit={limits[topic.id] ?? 8}
            onSelectAll={() => onSelectAll(topic.id)}
            onSelectSubtopic={onSelectSubtopic}
            onShowAll={() => handleShowAll(topic.id)}
          />
        ))}
      </div>
      {totalQuestions !== undefined && (
        <div style={{ fontSize: 17, color: '#FF6633', marginBottom: 7 }}>{totalQuestions} вопросов</div>
      )}
    </div>
  )
}
