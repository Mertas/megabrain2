import { FixtureLayout } from '../../organisms/FixtureLayout'
import { SearchForm } from './SearchForm'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function SearchFormFixture() {
  return (
    <FixtureLayout title="SearchForm">
      <Section title="Default (поиск тем)">
        <SearchForm />
      </Section>
      <Section title="Custom">
        <SearchForm placeholder="Найти вопрос..." buttonText="Искать" onSearch={(q) => alert(`Поиск: ${q}`)} />
      </Section>
    </FixtureLayout>
  )
}
