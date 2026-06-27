import { useState } from 'react'
import { FixtureLayout } from '../../organisms/FixtureLayout'
import { IconPicker } from './IconPicker'

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

export default function IconPickerFixture() {
  const [icon, setIcon] = useState('\u2659')

  return (
    <FixtureLayout title="IconPicker">
      <Section title="Выбор иконки уровня (32 символа)">
        <div style={{ paddingBottom: 80 }}>
          <IconPicker value={icon} icons={levelIcons} onChange={setIcon} />
          <span style={{ fontSize: 12, marginLeft: 12, verticalAlign: 'top', paddingTop: 16, display: 'inline-block' }}>
            Выбрано: {icon}
          </span>
        </div>
      </Section>
    </FixtureLayout>
  )
}
