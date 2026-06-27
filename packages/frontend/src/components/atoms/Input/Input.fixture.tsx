import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Input } from './Input'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>{children}</div>
    </div>
  )
}

export default function InputFixture() {
  return (
    <FixtureLayout title="Input">
      <Section title="States">
        <div style={{ width: 280 }}>
          <Input placeholder="Default" />
        </div>
        <div style={{ width: 280 }}>
          <Input label="Имя пользователя" placeholder="С лейблом" />
        </div>
        <div style={{ width: 280 }}>
          <Input label="Пароль" type="password" hint="Минимум 8 символов" />
        </div>
        <div style={{ width: 280 }}>
          <Input label="Email" error="Введите корректный email" defaultValue="bad-email" />
        </div>
        <div style={{ width: 280 }}>
          <Input label="Заблокировано" disabled defaultValue="Нельзя" />
        </div>
      </Section>

      <Section title="With Search Icon">
        <div style={{ width: 350 }}>
          <Input iconLeft={'\u{1F50D}'} defaultValue="Подобрать по ключевым словам" />
        </div>
      </Section>

      <Section title="Sizes">
        <div style={{ width: 200 }}>
          <Input size="sm" placeholder="Small (sm)" />
        </div>
        <div style={{ width: 250 }}>
          <Input placeholder="Medium (md)" />
        </div>
        <div style={{ width: 300 }}>
          <Input size="lg" placeholder="Large (lg)" />
        </div>
      </Section>
    </FixtureLayout>
  )
}
