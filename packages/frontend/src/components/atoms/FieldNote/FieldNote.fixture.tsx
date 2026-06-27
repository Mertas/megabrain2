import { FixtureLayout } from '../../organisms/FixtureLayout'
import { FieldNote } from './FieldNote'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function FieldNoteFixture() {
  return (
    <FixtureLayout title="FieldNote">
      <Section title="Variant: hint (подсказка под полем)">
        <FieldNote>*в разумных пределах, конечно ;)</FieldNote>
      </Section>

      <Section title="Variant: hint (с ссылкой)">
        <FieldNote>
          Ваше неотъемлемое право на подсказку на картинке сохраняется <a href="#">законами</a>
        </FieldNote>
      </Section>

      <Section title="Variant: copyright (в сайдбаре)">
        <div style={{ background: '#0E2136', padding: 16, borderRadius: 8 }}>
          <FieldNote variant="copyright">
            <p>&copy; <a href="#">futurico</a> 2011</p>
            <p>К сожалению, на данный момент уникальная система искусственного интеллекта MEGABRAIN.RU находится в стадии закрытого тестирования.</p>
          </FieldNote>
        </div>
      </Section>
    </FixtureLayout>
  )
}
