import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Button } from './Button'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </div>
  )
}

export default function ButtonFixture() {
  return (
    <FixtureLayout title="Button">
      <Section title="Variant: Primary">
        <Button variant="primary">СТАРТ!</Button>
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="lg">Large</Button>
      </Section>

      <Section title="Variant: Secondary">
        <Button variant="secondary">Отмена</Button>
        <Button variant="secondary" disabled>Disabled</Button>
      </Section>

      <Section title="Variant: Danger">
        <Button variant="danger">Внезапно прекратить</Button>
        <Button variant="danger" disabled>Disabled</Button>
        <Button variant="danger" loading>Loading</Button>
      </Section>

      <Section title="Variant: Link">
        <Button variant="link">почитать про это</Button>
        <Button variant="link" size="sm">Small link</Button>
      </Section>

      <Section title="Variant: Ghost">
        <Button variant="ghost">{'\u2716'}</Button>
        <Button variant="ghost" size="sm">Small ghost</Button>
      </Section>

      <Section title="With Icons">
        <Button iconLeft={'\u2692'}>Вопросы</Button>
        <Button iconRight={'\u21BA'}>Пропустить</Button>
      </Section>

      <Section title="Full Width">
        <div style={{ width: 400 }}>
          <Button fullWidth>На всю ширину</Button>
        </div>
      </Section>
    </FixtureLayout>
  )
}
