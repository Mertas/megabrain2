import { FixtureLayout } from '../../organisms/FixtureLayout'
import { TimeSettingRow } from './TimeSettingRow'

const perQuestionOpts = [
  { value: '10s', label: '10 секунд' },
  { value: '30s', label: '30 секунд' },
  { value: '1m', label: '1 минута' },
  { value: '5m', label: '5 минут' },
  { value: 'none', label: 'без ограничений' },
]

const perGameOpts = [
  { value: '5m', label: '5 минут' },
  { value: '10m', label: '10 минут' },
  { value: '30m', label: '30 минут' },
  { value: '1h', label: '1 час' },
  { value: 'none', label: 'без ограничений' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function TimeSettingRowFixture() {
  return (
    <FixtureLayout title="TimeSettingRow">
      <Section title="Настройка времени (из legacy)">
        <TimeSettingRow
          name="timing"
          label="на вопрос"
          hint="(10 минут на игру)"
          options={perQuestionOpts}
          defaultChecked
          value="1m"
        />
        <div style={{ margin: '2px 0 8px', fontSize: 12 }}>или</div>
        <TimeSettingRow
          name="timing"
          label="на игру"
          hint="(50 секунд на вопрос)"
          options={perGameOpts}
          value="10m"
        />
      </Section>
    </FixtureLayout>
  )
}
