import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Select } from './Select'

const timeOptions = [
  { value: '10s', label: '10 секунд' },
  { value: '30s', label: '30 секунд' },
  { value: '1m', label: '1 минута' },
  { value: '5m', label: '5 минут' },
  { value: 'none', label: 'без ограничений' },
]

const qtyOptions = [
  { value: '10', label: '10 вопросов' },
  { value: '20', label: '20 вопросов' },
  { value: '50', label: '50 вопросов' },
  { value: '100', label: '100 вопросов' },
  { value: 'all', label: 'все вопросы' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>{children}</div>
    </div>
  )
}

export default function SelectFixture() {
  return (
    <FixtureLayout title="Select">
      <Section title="States">
        <div style={{ width: 240 }}>
          <Select options={timeOptions} />
        </div>
        <div style={{ width: 240 }}>
          <Select options={timeOptions} placeholder="Выберите время..." />
        </div>
        <div style={{ width: 240 }}>
          <Select label="Количество вопросов" options={qtyOptions} />
        </div>
        <div style={{ width: 240 }}>
          <Select label="Время" error="Выберите значение" placeholder="—" options={timeOptions} />
        </div>
        <div style={{ width: 240 }}>
          <Select options={timeOptions} disabled />
        </div>
      </Section>

      <Section title="Sizes">
        <div style={{ width: 200 }}>
          <Select size="sm" options={timeOptions} />
        </div>
        <div style={{ width: 240 }}>
          <Select options={timeOptions} />
        </div>
        <div style={{ width: 280 }}>
          <Select size="lg" options={qtyOptions} />
        </div>
      </Section>
    </FixtureLayout>
  )
}
