import { useState } from 'react'
import { FixtureLayout } from '../../organisms/FixtureLayout'
import { TopicCard } from './TopicCard'

const physics = {
  id: 14, name: 'Физика', icon: '\u00A7',
  subtopics: [
    { id: 300, name: 'Механика' },
    { id: 301, name: 'Релятивистская механика' },
    { id: 302, name: 'Механика сплошных сред' },
    { id: 303, name: 'Гидродинамика' },
    { id: 304, name: 'Акустика' },
    { id: 305, name: 'Оптика' },
    { id: 306, name: 'Электродинамика' },
    { id: 307, name: 'Физика твёрдого тела' },
    { id: 308, name: 'Квантовая физика' },
    { id: 309, name: 'Ядерная физика' },
  ],
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
      <div style={{ clear: 'both' }} />
    </div>
  )
}

export default function TopicCardFixture() {
  const [selected, setSelected] = useState<number[]>([])
  const [expanded, setExpanded] = useState(false)
  const [limit, setLimit] = useState(6)

  return (
    <FixtureLayout title="TopicCard">
      <Section title="Select mode (выбор подтем)">
        <TopicCard
          topic={physics}
          mode="select"
          selectedIds={selected}
          visibleLimit={limit}
          onSelectSubtopic={(id) =>
            setSelected((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }
          onSelectAll={() => {
            const all = physics.subtopics.map((s) => s.id)
            setSelected((prev) => (prev.length === all.length ? [] : all))
          }}
          onShowAll={() => setLimit(physics.subtopics.length)}
        />
      </Section>

      <Section title="Profile mode (схлопывание)">
        <TopicCard
          topic={physics}
          mode="profile"
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
        />
      </Section>
    </FixtureLayout>
  )
}
