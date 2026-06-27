import { FixtureLayout } from './FixtureLayout'

function ColorSwatch({ name, hex, textColor }: { name: string; hex: string; textColor?: string }) {
  return (
    <div style={{ display: 'inline-block', width: 180, margin: '0 12px 12px 0', border: '1px solid #CCC', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ height: 80, backgroundColor: hex, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor || '#FFF', fontSize: 10, fontWeight: 'bold' }}>
        {hex}
      </div>
      <div style={{ padding: '8px 10px', fontSize: 10, backgroundColor: '#FAFAFA' }}>
        <strong>{name}</strong>
        <br /><code style={{ fontSize: 10 }}>{hex}</code>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ borderBottom: '3px solid #F9A253', paddingBottom: 8, marginBottom: 16, fontSize: 19 }}>{title}</h2>
      {children}
    </div>
  )
}

export default function DesignTokensFixture() {
  return (
    <FixtureLayout title="Design Tokens">
      <p style={{ color: '#666', marginBottom: 20, fontSize: 12 }}>
        Все дизайн-токены извлечены из оригинального style.css (2011). Базовый шрифт: 12px.
      </p>

      <Section title="Цветовая схема">
        <h3 style={{ fontSize: 14, marginBottom: 10, color: '#555' }}>Backgrounds</h3>
        <ColorSwatch name="Page Background" hex="#D9D7C2" textColor="#000" />
        <ColorSwatch name="Dark Background" hex="#182C3F" />
        <ColorSwatch name="Light Background" hex="#EDEBD2" textColor="#000" />
        <ColorSwatch name="White" hex="#FFFFFF" textColor="#000" />

        <h3 style={{ fontSize: 14, marginBottom: 10, marginTop: 16, color: '#555' }}>Primary & Accent</h3>
        <ColorSwatch name="Primary (Orange)" hex="#F9A253" textColor="#000" />
        <ColorSwatch name="Accent (Red-Orange)" hex="#FF6633" />

        <h3 style={{ fontSize: 14, marginBottom: 10, marginTop: 16, color: '#555' }}>Semantic</h3>
        <ColorSwatch name="Success (Green)" hex="#37CE74" />
        <ColorSwatch name="Error (Red)" hex="#FF0000" />
        <ColorSwatch name="Muted (Green)" hex="#6E9A90" />
        <ColorSwatch name="Border" hex="#C5C9CD" textColor="#000" />
      </Section>

      <Section title="Типографика (база 12px)">
        <pre style={{ backgroundColor: '#0E2136', color: '#EDEBD2', padding: 20, borderRadius: 8, fontSize: 10 }}>
{`$font-size-base:        10px   // 0.85em -> 10px
$font-size-sm:          10px   // 0.8em
$font-size-md:          12px   // 1em
$font-size-lg:          17px   // 1.4em
$font-size-xl:          19px   // 1.6em
$font-size-2xl:         24px   // 2em
$font-size-3xl:         48px   // 4em
$line-height-base:      1.3333
$font-family:           Verdana, sans-serif`}
        </pre>
      </Section>

      <Section title="Размеры layout">
        <pre style={{ backgroundColor: '#0E2136', color: '#EDEBD2', padding: 20, borderRadius: 8, fontSize: 10 }}>
{`$page-width:            990px
$content-width:         756px
$aside-width:           175px
$header-height:         108px
$border-radius:         10px`}
        </pre>
      </Section>

      <Section title="Навигационные иконки">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { icon: '\u00A7', label: 'Игра' },
            { icon: '\u2694', label: 'PvP' },
            { icon: '\u2692', label: 'Вопросы' },
            { icon: '\u262D', label: 'Люди' },
            { icon: '\u2721', label: 'Рейтинги' },
          ].map(item => (
            <div key={item.label} style={{ fontSize: 36, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDEBD2', borderTop: '1px solid #FFF', borderRight: '4px solid #F9A253' }}>
              <span title={item.label}>{item.icon}</span>
            </div>
          ))}
        </div>
      </Section>
    </FixtureLayout>
  )
}
