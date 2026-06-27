import { useState } from 'react'
import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Overlay } from './Overlay'
import { Button } from '../Button/Button'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

function OverlayDemo() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <Button variant="primary" onClick={() => setOpen(true)}>Показать оверлей</Button>
      <Overlay isOpen={open} onClose={() => setOpen(false)} />
      {open && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: '#FFF', padding: 32, borderRadius: 10, zIndex: 1001,
          boxShadow: '3px 3px 8px #111', textAlign: 'center',
        }}>
          <p style={{ fontSize: 19, marginBottom: 16 }}>Модальное окно</p>
          <Button variant="primary" onClick={() => setOpen(false)}>Закрыть</Button>
        </div>
      )}
    </div>
  )
}

export default function OverlayFixture() {
  return (
    <FixtureLayout title="Overlay">
      <Section title="Backdrop с fade-in (300ms)">
        <OverlayDemo />
      </Section>
    </FixtureLayout>
  )
}
