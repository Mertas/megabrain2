import { FixtureLayout } from '../../organisms/FixtureLayout'
import { TimerDigit } from './TimerDigit'

const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'c', 'd'] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function TimerDigitFixture() {
  return (
    <FixtureLayout title="TimerDigit">
      <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
        Шрифтовой спрайт digits.png из legacy. Каждый символ — span с background-position.
      </p>

      <Section title="Все символы (0-9, c = colon, d = dot)">
        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          {chars.map((c) => (
            <div key={c} style={{ textAlign: 'center' }}>
              <TimerDigit char={c} />
              <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>{c}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Таймер: 00c12d45 (MM:SS.CC из legacy)">
        <div style={{ display: 'flex', gap: 0 }}>
          <TimerDigit char="0" />
          <TimerDigit char="0" />
          <TimerDigit char="c" />
          <TimerDigit char="1" />
          <TimerDigit char="2" />
          <TimerDigit char="d" />
          <TimerDigit char="4" />
          <TimerDigit char="5" />
        </div>
      </Section>
    </FixtureLayout>
  )
}
