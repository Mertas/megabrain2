import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Divider } from './Divider'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function DividerFixture() {
  return (
    <FixtureLayout title="Divider">
      <Section title="Variants">
        <p style={{ fontSize: 12 }}>Solid</p>
        <Divider variant="solid" />
        <p style={{ fontSize: 12 }}>Dashed</p>
        <Divider variant="dashed" />
        <p style={{ fontSize: 12 }}>Dotted</p>
        <Divider variant="dotted" />
      </Section>

      <Section title="With Label">
        <Divider label="или" />
      </Section>

      <Section title="Spacing (sm / md / lg)">
        <p style={{ fontSize: 12 }}>spacing sm</p>
        <Divider spacing="sm" />
        <p style={{ fontSize: 12 }}>spacing md (default)</p>
        <Divider spacing="md" />
        <p style={{ fontSize: 12 }}>spacing lg</p>
        <Divider spacing="lg" />
      </Section>
    </FixtureLayout>
  )
}
