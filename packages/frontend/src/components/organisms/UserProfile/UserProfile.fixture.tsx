import { Layout } from '../Layout/Layout'
import { UserProfile } from './UserProfile'

const mockUser = {
  level: 1,
  icon: '\u2659',
  nickname: 'CocaineTeddyBear',
  name: 'Михаил Морозов-Заевропейский',
  location: 'Российская Федерация, Благовещенск (Амурская область)',
  firstSeen: '20.05.2011',
  topics: [
    { name: 'Физика', subtopics: ['ЕГЭ 2010'] },
    { name: 'Химия', subtopics: ['ЕГЭ 2009', 'Органическая химия', 'Нефтехимия', 'Фотохимия'] },
    { name: 'География', subtopics: ['Биогеография', 'Геология', 'Гидрология', 'Картография', 'Экономическая география'] },
  ],
}

export default function UserProfileFixture() {
  return (
    <Layout activeNav="people" breadcrumbs={[{ label: 'Люди' }, { label: 'CocaineTeddyBear' }]}>
      <UserProfile user={mockUser} isOwner />
    </Layout>
  )
}
