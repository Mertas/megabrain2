import { Layout } from '../Layout/Layout'
import { UserProfile } from './UserProfile'

const mockUser = {
  level: 1,
  icon: '\u2659',
  nickname: 'CocaineTeddyBear',
  name: 'Михаил Морозов-Заевропейский',
  login: 'teddy',
  location: 'Российская Федерация, Благовещенск (Амурская область)',
  firstSeen: '20.05.2011',
  topics: [
    { name: 'Физика', subtopics: ['ЕГЭ 2010'] },
    { name: 'Химия', subtopics: ['ЕГЭ 2009', 'Органическая химия', 'Нефтехимия', 'Фотохимия'] },
    { name: 'География', subtopics: ['Биогеография', 'Геология', 'Гидрология', 'Картография', 'Экономическая география'] },
  ],
  stats: {
    questionsAuthored: 15,
    totalGames: 247,
    totalQuestions: 3120,
    totalCorrect: 2340,
    overallAccuracy: 75,
    solo: { gamesPlayed: 120, totalQuestions: 1800, totalCorrect: 1350, accuracy: 75, avgScore: 45.2, totalScore: 5424 },
    pvp: { gamesPlayed: 56, wins: 32, losses: 20, draws: 4, rating: 1340 },
    blitz: { gamesPlayed: 38, wins: 22, losses: 14, draws: 2, rating: 1280 },
    survival: { gamesPlayed: 33, totalQuestions: 620, totalCorrect: 480, accuracy: 77, avgScore: 280.5, totalScore: 9258, bestScore: 520, bestStreak: 28 },
    gamesByFormat: [
      { format: 'solo', count: 120, label: 'Соло' },
      { format: 'pvp', count: 56, label: 'PvP' },
      { format: 'blitz', count: 38, label: 'Блиц' },
      { format: 'survival', count: 33, label: 'Выживание' },
    ],
    authoredByCategory: [
      {
        category: 'Физика',
        total: 12,
        topics: [
          { topic: 'Механика', count: 7 },
          { topic: 'Термодинамика', count: 5 },
        ],
      },
      {
        category: 'Химия',
        total: 8,
        topics: [
          { topic: 'Органическая химия', count: 5 },
          { topic: 'Неорганическая химия', count: 3 },
        ],
      },
      {
        category: 'Биология',
        total: 5,
        topics: [
          { topic: 'Генетика', count: 3 },
          { topic: 'Экология', count: 2 },
        ],
      },
      { category: 'История', total: 3, topics: [{ topic: 'XX век', count: 3 }] },
      { category: 'География', total: 2, topics: [{ topic: 'Картография', count: 2 }] },
    ],
    recent: [
      { id: 1, format: 'survival', total: 25, correct: 22, score: 420, date: '2026-07-07' },
      { id: 2, format: 'pvp', total: 10, correct: 1, score: 85, date: '2026-07-07' },
      { id: 3, format: 'solo', total: 10, correct: 8, score: 42, date: '2026-07-06' },
      { id: 4, format: 'blitz', total: 5, correct: 0, score: 30, date: '2026-07-06' },
    ],
  },
}

export default function UserProfileFixture() {
  return (
    <Layout activeNav="people" breadcrumbs={[{ label: 'Люди' }, { label: 'CocaineTeddyBear' }]}>
      <UserProfile user={mockUser} isOwner />
    </Layout>
  )
}
