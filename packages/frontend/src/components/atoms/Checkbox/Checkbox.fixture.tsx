import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Checkbox } from './Checkbox'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </div>
  )
}

export default function CheckboxFixture() {
  return (
    <FixtureLayout title="Checkbox">
      <Section title="States">
        <Checkbox label="Unchecked" />
        <Checkbox label="Checked" defaultChecked />
        <Checkbox label="Indeterminate" indeterminate />
      </Section>

      <Section title="Disabled">
        <Checkbox label="Disabled" disabled />
        <Checkbox label="Disabled Checked" disabled defaultChecked />
      </Section>

      <Section title="Legacy: настройка игры">
        <Checkbox label="только новые (159)" defaultChecked />
      </Section>

      <Section title="Small">
        <Checkbox size="sm" label="Компактный чекбокс" defaultChecked />
      </Section>
    </FixtureLayout>
  )
}
