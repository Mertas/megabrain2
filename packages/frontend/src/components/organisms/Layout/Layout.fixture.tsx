import { Layout } from './Layout'

export default function LayoutFixture() {
  return (
    <Layout activeNav="game" breadcrumbs={[{ label: 'Игра' }, { label: 'Астрономия' }]}>
      <h1>Layout — всё работает</h1>
      <p style={{ fontSize: 12 }}>Header + Sidebar + Breadcrumbs + контентная область.</p>
    </Layout>
  )
}
