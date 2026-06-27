import { useState } from 'react'
import { FixtureLayout } from '../../organisms/FixtureLayout'
import { GameQuitConfirm } from './GameQuitConfirm'

function Demo() {
  const [visible, setVisible] = useState(false)
  return (
    <GameQuitConfirm
      visible={visible}
      onRequestConfirm={() => setVisible(true)}
      onConfirm={() => alert('Игра прекращена!')}
      onCancel={() => setVisible(false)}
    />
  )
}

export default function GameQuitConfirmFixture() {
  return (
    <FixtureLayout title="GameQuitConfirm">
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>Двухфазное подтверждение</h3>
        <Demo />
      </div>
    </FixtureLayout>
  )
}
