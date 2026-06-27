import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Radio } from './Radio'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </div>
  )
}

export default function RadioFixture() {
  return (
    <FixtureLayout title="Radio">
      <Section title="States">
        <Radio name="s1" label="Unchecked" />
        <Radio name="s1" label="Checked" defaultChecked />
        <Radio name="s2" label="Disabled" disabled />
        <Radio name="s2" label="Disabled Checked" disabled defaultChecked />
      </Section>

      <Section title="Label Position">
        <Radio name="s3" label="Label right (default)" />
        <Radio name="s3" label="Label left" labelPosition="left" />
      </Section>

      <Section title="Group (настройка времени)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Radio name="timing" label="на вопрос" defaultChecked />
          <Radio name="timing" label="на игру" />
          <Radio name="timing" label="без ограничений" />
        </div>
      </Section>

      <Section title="Small size">
        <Radio name="s4" label="Компактный" size="sm" defaultChecked />
        <Radio name="s4" label="Тоже компактный" size="sm" />
      </Section>
    </FixtureLayout>
  )
}
