import { FixtureLayout } from '../../organisms/FixtureLayout'
import { SubtopicBadge } from './SubtopicBadge'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ fontSize: 12 }}>{children}</div>
    </div>
  )
}

export default function SubtopicBadgeFixture() {
  return (
    <FixtureLayout title="SubtopicBadge">
      <Section title="Unselected">
        <SubtopicBadge name="ЕГЭ 2010" />
        <SubtopicBadge name="Микробиология" />
        <SubtopicBadge name="Зоология" />
        <SubtopicBadge name="Ботаника" />
      </Section>

      <Section title="Selected">
        <SubtopicBadge name="ЕГЭ 2010" selected />
        <SubtopicBadge name="Микробиология" selected />
        <SubtopicBadge name="Зоология" />
      </Section>
    </FixtureLayout>
  )
}
