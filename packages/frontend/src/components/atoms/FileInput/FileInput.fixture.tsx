import { FixtureLayout } from '../../organisms/FixtureLayout'
import { FileInput } from './FileInput'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>{children}</div>
    </div>
  )
}

export default function FileInputFixture() {
  return (
    <FixtureLayout title="FileInput">
      <Section title="States">
        <FileInput label="Загрузить картинку" buttonText="Выбрать файл" />
        <FileInput label="Картинка" hint="mp3, flv-видео или картинки gif, jpg, png" />
        <FileInput label="Файл" error="Файл обязателен" />
        <FileInput label="Заблокировано" disabled />
      </Section>

      <Section title="Accept filter">
        <FileInput
          label="Только картинки"
          accept="image/*"
          buttonText="Выбрать картинку"
        />
      </Section>
    </FixtureLayout>
  )
}
