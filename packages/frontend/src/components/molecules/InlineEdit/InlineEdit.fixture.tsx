import { FixtureLayout } from '../../organisms/FixtureLayout'
import { InlineEdit } from './InlineEdit'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function InlineEditFixture() {
  return (
    <FixtureLayout title="InlineEdit">
      <Section title="Редактирование ника">
        <InlineEdit value="CocaineTeddyBear" onSave={(v) => alert(`Сохранено: ${v}`)} />
      </Section>
      <Section title="Пустое значение">
        <InlineEdit value="" placeholder="Введите имя..." onSave={(v) => alert(`Сохранено: ${v}`)} />
      </Section>
    </FixtureLayout>
  )
}
