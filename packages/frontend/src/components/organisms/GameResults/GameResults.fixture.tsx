import { Layout } from '../Layout/Layout'
import { GameResults } from './GameResults'

const mockResult = {
  total: 10,
  correct: 7,
  timeCs: 120000,
  questions: [
    { question: { id: 1, text: 'На какой планете самая высокая гора?', answers: ['Марс', 'Уран', 'Венера', 'Нептун'], imageUrl: '/i/sample_question_pic.jpg' }, selectedIndex: 0, correctIndex: 0, timeElapsedCs: 300 },
    { question: { id: 2, text: 'У какой планеты больше всего лун?', answers: ['Юпитер', 'Уран', 'Венера', 'Нептун'], imageUrl: '/i/sample_question_pic_2.jpg' }, selectedIndex: 3, correctIndex: 0, timeElapsedCs: 500 },
    { question: { id: 3, text: 'Сколько планет в Солнечной системе?', answers: ['7', '8', '9', '10'] }, selectedIndex: 1, correctIndex: 1, timeElapsedCs: 200 },
    { question: { id: 4, text: 'Ближайшая к Солнцу планета?', answers: ['Меркурий', 'Венера', 'Земля', 'Марс'] }, selectedIndex: 2, correctIndex: 0, timeElapsedCs: 400 },
  ],
}

export default function GameResultsFixture() {
  return (
    <Layout activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Результаты' }]}>
      <GameResults result={mockResult} />
    </Layout>
  )
}
