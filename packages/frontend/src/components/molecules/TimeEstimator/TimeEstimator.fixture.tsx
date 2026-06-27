import { FixtureLayout } from '../../organisms/FixtureLayout'
import { TimeEstimator } from './TimeEstimator'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ fontSize: 12 }}>{children}</div>
    </div>
  )
}

export default function TimeEstimatorFixture() {
  return (
    <FixtureLayout title="TimeEstimator">
      <Section title="Per question: 30s × 20 вопросов">
        на вопрос <TimeEstimator mode="per_question" timeSeconds={30} totalItems={20} />
      </Section>

      <Section title="Per game: 10 min на 20 вопросов">
        на игру <TimeEstimator mode="per_game" timeSeconds={600} totalItems={20} />
      </Section>

      <Section title="Per question: 60s × 50 вопросов">
        на вопрос <TimeEstimator mode="per_question" timeSeconds={60} totalItems={50} />
      </Section>
    </FixtureLayout>
  )
}
