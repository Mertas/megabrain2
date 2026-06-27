import { Layout } from '../Layout/Layout'
import { TopicList } from './TopicList'
import { useState } from 'react'

const mockTopics = [
  { id: 14, name: 'Физика', icon: '\u00A7', subtopics: [
    { id: 300, name: 'Механика' }, { id: 301, name: 'Релятивистская механика' },
    { id: 302, name: 'Механика сплошных сред' }, { id: 303, name: 'Гидродинамика' },
    { id: 304, name: 'Акустика' }, { id: 305, name: 'Оптика' },
    { id: 306, name: 'Электродинамика' }, { id: 307, name: 'Физика твёрдого тела' },
    { id: 308, name: 'Квантовая физика' }, { id: 309, name: 'Ядерная физика' },
  ]},
  { id: 15, name: 'Химия', icon: '\u00A7', subtopics: [
    { id: 400, name: 'Агрохимия' }, { id: 401, name: 'Аналитическая химия' },
    { id: 402, name: 'Биоорганическая химия' }, { id: 403, name: 'Биохимия' },
  ]},
]

export default function TopicListFixture() {
  const [selected, setSelected] = useState<number[]>([])

  return (
    <Layout activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Новая игра' }]}>
      <h1>Начать игру</h1>
      <TopicList
        topics={mockTopics}
        selectedIds={selected}
        onSelectSubtopic={(id) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
        onSelectAll={(topicId) => {
          const topic = mockTopics.find((t) => t.id === topicId)!
          const ids = topic.subtopics.map((s) => s.id)
          const allSelected = ids.every((id) => selected.includes(id))
          setSelected((p) => allSelected ? p.filter((x) => !ids.includes(x)) : [...new Set([...p, ...ids])])
        }}
        totalQuestions={1234}
      />
    </Layout>
  )
}
