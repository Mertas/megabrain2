import { Layout } from '../Layout/Layout'
import { NewGameForm } from './NewGameForm'

const mockCategories = [
  { id: 1, name: 'Наука', icon: '\u00A7', topics: [
    { id: 14, name: 'Физика', question_count: 20 },
    { id: 15, name: 'Химия', question_count: 15 },
  ]},
]

export default function NewGameFormFixture() {
  return (
    <Layout activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Новая игра' }]}>
      <NewGameForm categories={mockCategories} onStart={(c) => alert(JSON.stringify(c, null, 2))} />
    </Layout>
  )
}
