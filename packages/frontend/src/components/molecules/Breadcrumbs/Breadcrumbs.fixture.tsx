import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Breadcrumbs } from './Breadcrumbs'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function BreadcrumbsFixture() {
  return (
    <FixtureLayout title="Breadcrumbs">
      <Section title="Two levels (Игра: Астрономия)">
        <Breadcrumbs items={[{ label: 'Игра', href: '/game' }, { label: 'Астрономия' }]} />
      </Section>
      <Section title="Three levels">
        <Breadcrumbs items={[{ label: 'Игра', href: '/game' }, { label: 'Результаты', href: '/results' }, { label: 'Астрономия' }]} />
      </Section>
    </FixtureLayout>
  )
}
