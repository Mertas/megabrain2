import { FixtureLayout } from '../../organisms/FixtureLayout'
import { SearchCheck } from './SearchCheck'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function SearchCheckFixture() {
  return (
    <FixtureLayout title="SearchCheck">
      <Section title="Проверка вопроса в поисковиках">
        <SearchCheck questionText="На какой из планет нашей солнечной системы находится самая крупная гора?" />
      </Section>
    </FixtureLayout>
  )
}
