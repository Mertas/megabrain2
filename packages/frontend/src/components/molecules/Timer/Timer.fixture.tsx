import { useEffect, useState } from 'react'
import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Timer } from './Timer'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

function DemoTimer({ start }: { start: number }) {
  const [cs, setCs] = useState(start)
  useEffect(() => {
    const id = setInterval(() => setCs((c) => c + 1), 10)
    return () => clearInterval(id)
  }, [])
  return <Timer value={cs} />
}

export default function TimerFixture() {
  return (
    <FixtureLayout title="Timer">
      <Section title="Static: 00:12.45">
        <Timer value={1245} />
      </Section>
      <Section title="Static: 01:30.00">
        <Timer value={9000} />
      </Section>
      <Section title="Live (incrementing)">
        <DemoTimer start={5800} />
      </Section>
      <Section title="С полосой прогресса (15 с)">
        <Timer value={420} total={1500} />
      </Section>
    </FixtureLayout>
  )
}
