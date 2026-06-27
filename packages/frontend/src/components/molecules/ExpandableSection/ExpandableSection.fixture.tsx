import { FixtureLayout } from '../../organisms/FixtureLayout'
import { ExpandableSection } from './ExpandableSection'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function ExpandableSectionFixture() {
  return (
    <FixtureLayout title="ExpandableSection">
      <Section title="Dotted link (почитать про это)">
        <ExpandableSection trigger="почитать про это">
          <p>Гора Олимп (лат. Olympus Mons) — потухший вулкан на Марсе, самая высокая гора в Солнечной системе. Высота — 21.2 км.</p>
          <p>Источник: <a href="#">Википедия</a></p>
        </ExpandableSection>
      </Section>

      <Section title="Plain link">
        <ExpandableSection trigger="показать все" variant="plain">
          <p>Раскрытое содержимое с дополнительной информацией.</p>
        </ExpandableSection>
      </Section>
    </FixtureLayout>
  )
}
