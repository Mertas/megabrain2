import { FixtureLayout } from '../../organisms/FixtureLayout'
import { AnswerOption } from './AnswerOption'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}

export default function AnswerOptionFixture() {
  return (
    <FixtureLayout title="AnswerOption">
      <Section title="Idle">
        <AnswerOption number={1} text="Марс" onClick={() => {}} />
        <AnswerOption number={2} text="Уран" onClick={() => {}} />
        <AnswerOption number={3} text="Венера" onClick={() => {}} />
        <AnswerOption number={4} text="Нептун" onClick={() => {}} />
      </Section>

      <Section title="Correct">
        <AnswerOption number={1} text="Марс" state="correct" />
        <AnswerOption number={2} text="Уран" state="correct" muted />
      </Section>

      <Section title="Wrong">
        <AnswerOption number={3} text="Венера" state="wrong" />
      </Section>

      <Section title="Flash">
        <AnswerOption number={1} text="Марс" flash />
      </Section>

      <Section title="Long text">
        <AnswerOption number={1} text="Обогнать учебный автомобиль по встречной полосе, поравняться с ним, включить звуковой сигнал и покрутить у виска" onClick={() => {}} />
      </Section>
    </FixtureLayout>
  )
}
