import { Layout } from '../Layout/Layout'
import { GameBoard } from './GameBoard'

const mock = [
  { id: 1, text: 'На какой планете находится самая высокая гора?', answers: ['Марс', 'Уран', 'Венера', 'Нептун'], imageUrl: '/i/sample_question_pic.jpg' },
  { id: 2, text: 'У какой планеты больше всего лун?', answers: ['Юпитер', 'Уран', 'Венера', 'Нептун'], imageUrl: '/i/sample_question_pic_2.jpg' },
  { id: 3, text: 'Сколько планет в Солнечной системе?', answers: ['7', '8', '9', '10'] },
  { id: 4, text: 'Ближайшая к Солнцу планета?', answers: ['Меркурий', 'Венера', 'Земля', 'Марс'] },
]

export default function GameBoardFixture() {
  return (
    <Layout activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Астрономия' }]}>
      <GameBoard questions={mock} timeMode="per_question" timeSeconds={60} isAdmin onFinish={(r) => alert(`Игра окончена! ${r.correct}/${r.total} за ${(r.timeCs / 100).toFixed(1)}с`)} />
    </Layout>
  )
}
