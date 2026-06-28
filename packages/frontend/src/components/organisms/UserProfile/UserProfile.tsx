import { useState } from 'react'
import { InlineEdit } from '../../molecules/InlineEdit/InlineEdit'
import { TopicCard, type Topic } from '../../molecules/TopicCard/TopicCard'
import styles from './UserProfile.module.scss'

export interface UserProfileProps {
  user: {
    level: number
    icon: string
    nickname: string
    name: string
    location: string
    firstSeen: string
    topics: { name: string; subtopics: string[] }[]
  }
  isOwner?: boolean
  onSave?: (fields: { nickname?: string; name?: string }) => void
}

export function UserProfile({ user, isOwner = false, onSave }: UserProfileProps) {
  const [nickname, setNickname] = useState(user.nickname)
  const [name, setName] = useState(user.name)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const handleSave = (field: string, value: string) => {
    onSave?.({ [field]: value })
  }

  const profileTopics: Topic[] = user.topics.map((t, i) => ({
    id: i,
    name: t.name,
    icon: '',
    subtopics: t.subtopics.map((s, j) => ({ id: j, name: s })),
  }))

  return (
    <div className={styles.profile}>
      <div className={styles.left}>
        <div className={styles.iconRow}>
          <span className={styles.iconStatic}>{user.icon}</span>
        </div>

        <a href="#" className={styles.level}>{user.level}</a>
        <h1 className={styles.nickname}>
          {isOwner ? (
            <InlineEdit value={nickname} onSave={(v) => { setNickname(v); handleSave('nickname', v) }} label="Ник" />
          ) : (
            nickname
          )}
        </h1>

        {isOwner ? (
          <div className={styles.editRow}>
            <InlineEdit value={name} onSave={(v) => { setName(v); handleSave('name', v) }} label="Имя" />
          </div>
        ) : (
          <h2 className={styles.name}>{name}</h2>
        )}

        <div className={styles.location}>{user.location}</div>
        <div className={styles.firstSeen}>Впервые увидел эту страницу {user.firstSeen}</div>
      </div>

      <div className={styles.right}>
        {profileTopics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            mode="profile"
            expanded={expanded[topic.id] || false}
            onToggle={() => setExpanded((p) => ({ ...p, [topic.id]: !p[topic.id] }))}
          />
        ))}
      </div>
    </div>
  )
}
