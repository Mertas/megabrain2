import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Badge } from './Badge'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </div>
  )
}

export default function BadgeFixture() {
  return (
    <FixtureLayout title="Badge">
      <Section title="Variants">
        <Badge variant="success">верный ответ</Badge>
        <Badge variant="error">ваш ответ неверен</Badge>
        <Badge variant="warning">12 вопросов</Badge>
        <Badge variant="info">Астрономия</Badge>
        <Badge variant="muted">пропущено</Badge>
      </Section>

      <Section title="Pill (закруглённые)">
        <Badge variant="success" pill>выполнено</Badge>
        <Badge variant="error" pill>ошибка</Badge>
        <Badge variant="warning" pill>ожидание</Badge>
        <Badge variant="info" pill>тег</Badge>
      </Section>

      <Section title="Small size">
        <Badge size="sm" variant="success">159</Badge>
        <Badge size="sm" variant="error">!</Badge>
        <Badge size="sm" variant="info">new</Badge>
      </Section>
    </FixtureLayout>
  )
}
