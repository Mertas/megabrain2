import { FixtureLayout } from '../../organisms/FixtureLayout'
import { AnswerGrid } from './AnswerGrid'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

const mockCheck = (correctIdx: number) => async (answerText: string) => {
  const answers = ['Марс', 'Уран', 'Венера', 'Нептун']
  const idx = answers.indexOf(answerText)
  await new Promise((r) => setTimeout(r, 500))
  return { correct: idx === correctIdx, correctAnswer: answers[correctIdx] }
}

const fullAnswers = ['Марс', 'Уран', 'Венера', 'Нептун']

export default function AnswerGridFixture() {
  return (
    <FixtureLayout title="AnswerGrid">
      <Section title="Интерактивная игра (правильный: Марс)">
        <AnswerGrid question="На какой планете самая высокая гора?" answers={fullAnswers} onAnswer={mockCheck(0)} />
      </Section>
    </FixtureLayout>
  )
}
