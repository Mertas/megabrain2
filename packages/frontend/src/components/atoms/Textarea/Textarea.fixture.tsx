import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Textarea } from './Textarea'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>{children}</div>
    </div>
  )
}

export default function TextareaFixture() {
  return (
    <FixtureLayout title="Textarea">
      <Section title="States">
        <div style={{ width: 350 }}>
          <Textarea rows={4} placeholder="Default textarea" />
        </div>
        <div style={{ width: 350 }}>
          <Textarea label="Текст вопроса" rows={4} />
        </div>
        <div style={{ width: 350 }}>
          <Textarea label="Вопрос" error="Вопрос не может быть пустым" rows={3} />
        </div>
        <div style={{ width: 350 }}>
          <Textarea disabled defaultValue="Заблокированный textarea" rows={3} />
        </div>
      </Section>

      <Section title="Auto-Resize">
        <div style={{ width: 350 }}>
          <Textarea
            autoResize minRows={2} maxRows={8}
            placeholder="Печатайте — поле растёт..."
            defaultValue={'Строка 1\nСтрока 2\nСтрока 3'}
          />
        </div>
      </Section>

      <Section title="New Question (из legacy)">
        <div style={{ width: 420 }}>
          <Textarea
            label="Вопрос"
            defaultValue="Вопрос, сформулированный точно, кратко и недвусмысленно*"
            hint="*в разумных пределах, конечно ;)"
            rows={5} size="lg"
          />
        </div>
      </Section>
    </FixtureLayout>
  )
}
