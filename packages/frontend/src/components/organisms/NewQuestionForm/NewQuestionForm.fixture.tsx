import { Layout } from '../Layout/Layout'
import { NewQuestionForm } from './NewQuestionForm'

export default function NewQuestionFormFixture() {
  return (
    <Layout activeNav="questions" breadcrumbs={[{ label: 'Вопросы' }, { label: 'Новый вопрос' }]}>
      <NewQuestionForm topics={[]} onSubmit={(d) => alert(JSON.stringify(d, null, 2))} />
    </Layout>
  )
}
