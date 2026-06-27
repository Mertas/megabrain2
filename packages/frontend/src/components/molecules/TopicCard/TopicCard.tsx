import { SubtopicBadge } from '../SubtopicBadge/SubtopicBadge'
import styles from './TopicCard.module.scss'

export interface Subtopic {
  id: number
  name: string
}

export interface Topic {
  id: number
  name: string
  icon: string
  subtopics: Subtopic[]
}

export interface TopicCardProps {
  topic: Topic
  mode: 'select' | 'profile'
  selectedIds?: number[]
  visibleLimit?: number
  onSelectAll?: () => void
  onSelectSubtopic?: (id: number) => void
  onShowAll?: () => void
  onToggle?: () => void
  expanded?: boolean
}

export function TopicCard({
  topic,
  mode,
  selectedIds = [],
  visibleLimit = 8,
  onSelectAll,
  onSelectSubtopic,
  onShowAll,
  onToggle,
  expanded = false,
}: TopicCardProps) {
  const allSelected = topic.subtopics.length > 0 && topic.subtopics.every((s) => selectedIds.includes(s.id))
  const visible = topic.subtopics.slice(0, visibleLimit)
  const hidden = topic.subtopics.slice(visibleLimit)
  const hasMore = hidden.length > 0

  if (mode === 'profile') {
    return (
      <span className={styles.profileRow}>
        <button type="button" className={styles.toggle} onClick={onToggle} aria-expanded={expanded}>
          {expanded ? '[\u2013]' : '[+]'}
        </button>
        <a href="#" className={`${styles.profileName} ${expanded ? styles.active : ''}`}>
          {topic.name}<span className={styles.colon}>:</span>
        </a>
        {expanded && (
          <span className={styles.profileSubtopics}>
            {topic.subtopics.map((s) => (
              <a key={s.id} href="#" className={styles.profileSubtopic}>{s.name}</a>
            ))}
          </span>
        )}
      </span>
    )
  }

  return (
    <div className={styles.topic}>
      <h3>
        {topic.icon}{' '}
        <span className={styles.topicLink} onClick={onSelectAll} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onSelectAll?.() }}>
          {topic.name}
        </span>
      </h3>
      <div className={styles.selectAll}>
        <button type="button" className={styles.selectAllBtn} onClick={onSelectAll}>
          {allSelected ? 'отменить' : 'выбрать все'}
        </button>
      </div>
      <div className={styles.subtopics}>
        {visible.map((s) => (
          <SubtopicBadge
            key={s.id}
            name={s.name}
            selected={selectedIds.includes(s.id)}
            onClick={() => onSelectSubtopic?.(s.id)}
          />
        ))}
        {hasMore && (
          <SubtopicBadge
            key="show-all"
            name="показать все"
            onClick={onShowAll}
          />
        )}
      </div>
    </div>
  )
}
