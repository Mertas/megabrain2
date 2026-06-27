import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Spinner } from './Spinner'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </div>
  )
}

export default function SpinnerFixture() {
  return (
    <FixtureLayout title="Spinner">
      <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
        Чистый CSS-спиннер. border-top-color: #FF6633.
      </p>

      <Section title="Sizes">
        <div style={{ textAlign: 'center' }}>
          <Spinner size="sm" />
          <span style={{ fontSize: 10, color: '#999', display: 'block', marginTop: 4 }}>16px (sm)</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Spinner size="md" />
          <span style={{ fontSize: 10, color: '#999', display: 'block', marginTop: 4 }}>32px (md)</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Spinner size="lg" />
          <span style={{ fontSize: 10, color: '#999', display: 'block', marginTop: 4 }}>48px (lg)</span>
        </div>
      </Section>

      <Section title="Inline (в строке с текстом)">
        <div style={{ fontSize: 12 }}>
          Загрузка данных... <Spinner size="sm" inline />
        </div>
      </Section>

      <Section title="Custom Color (#37CE74)">
        <div style={{ textAlign: 'center' }}>
          <Spinner color="#37CE74" label="Сохранение..." size="md" />
          <span style={{ fontSize: 10, color: '#999', display: 'block', marginTop: 4 }}>success</span>
        </div>
      </Section>
    </FixtureLayout>
  )
}
