import { FixtureLayout } from '../../organisms/FixtureLayout'
import { CloseButton } from './CloseButton'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </div>
  )
}

export default function CloseButtonFixture() {
  return (
    <FixtureLayout title="CloseButton">
      <Section title="Sizes">
        <CloseButton size="sm" />
        <span style={{ fontSize: 10, color: '#999' }}>sm (16px)</span>
        <CloseButton size="md" />
        <span style={{ fontSize: 10, color: '#999' }}>md (24px)</span>
      </Section>

      <Section title="In context (модалка тем)">
        <div style={{ position: 'relative', border: '1px solid #CCC', padding: 16, borderRadius: 10, width: 320, background: '#FFF' }}>
          <div style={{ position: 'absolute', top: 5, right: 5 }}>
            <CloseButton size="sm" />
          </div>
          <h3 style={{ fontSize: 19, margin: '0 0 12px' }}>{'\u00A7'} Биология</h3>
          <p style={{ fontSize: 12 }}>
            ЕГЭ 2010, Микробиология, Зоология, Происхождение видов, Ботаника...
          </p>
        </div>
      </Section>
    </FixtureLayout>
  )
}
