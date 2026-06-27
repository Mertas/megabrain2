import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Icon } from './Icon'

const navIcons = [
  { symbol: '\u00A7', label: 'Игра' },
  { symbol: '\u2694', label: 'PvP' },
  { symbol: '\u2692', label: 'Вопросы' },
  { symbol: '\u262D', label: 'Люди' },
  { symbol: '\u2721', label: 'Рейтинги' },
]

const levelIcons = [
  '\u2680','\u2681','\u2682','\u2683','\u2684','\u2685',
  '\u2660','\u2665','\u2663','\u2666',
  '\u2654','\u2655','\u2656','\u2657','\u2658','\u2659',
  '\u265A','\u265B','\u265C','\u265D','\u265E','\u265F',
  '\u2605','\u262D','\u2620','\u269B','\u2606','\u263C',
  '\u26A1','\u25CF','\u2624','\u2721','\u263A','\u2622',
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function IconFixture() {
  return (
    <FixtureLayout title="Icon">
      <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
        Рендерит Unicode-символы. Базовый размер 12px.
      </p>

      <Section title="Навигационные иконки (xl = 24px)">
        <div style={{ display: 'flex', gap: 16 }}>
          {navIcons.map(({ symbol, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <Icon symbol={symbol} size="xl" label={label} />
              <div style={{ fontSize: 10, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Размеры (sm=8px, md=12px, lg=19px, xl=24px)">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Icon symbol={'\u00A7'} size="sm" /><span style={{ fontSize: 10, color: '#999' }}>8px</span>
          <Icon symbol={'\u00A7'} size="md" /><span style={{ fontSize: 10, color: '#999' }}>12px</span>
          <Icon symbol={'\u00A7'} size="lg" /><span style={{ fontSize: 10, color: '#999' }}>19px</span>
          <Icon symbol={'\u00A7'} size="xl" /><span style={{ fontSize: 10, color: '#999' }}>24px</span>
        </div>
      </Section>

      <Section title="Иконки уровней (32 символа)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 360 }}>
          {levelIcons.map((s, i) => (
            <Icon key={i} symbol={s} size="lg" />
          ))}
        </div>
      </Section>
    </FixtureLayout>
  )
}
