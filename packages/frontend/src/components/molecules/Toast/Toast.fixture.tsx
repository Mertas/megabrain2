import { useState } from 'react'
import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Toast } from './Toast'
import { Button } from '../../atoms/Button/Button'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

function ToastDemo({ variant, message }: { variant: 'correct' | 'wrong' | 'info'; message: string }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <Button variant="primary" size="sm" onClick={() => setShow(true)}>Показать {variant}</Button>
      {show && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 9999 }}>
          <Toast variant={variant} message={message} onClose={() => setShow(false)} autoHide={2000} />
        </div>
      )}
    </div>
  )
}

export default function ToastFixture() {
  return (
    <FixtureLayout title="Toast">
      <Section title="Correct (зелёный, 100px)">
        <Toast variant="correct" message="Марс" />
      </Section>

      <Section title="Wrong (красный, 100px)">
        <Toast variant="wrong" message="Нептун" />
      </Section>

      <Section title="Info (оранжевый, 600px)">
        <Toast variant="info" message="Вы сегодня творите чудеса!" />
      </Section>

      <Section title="Interactive (auto-hide 2s)">
        <ToastDemo variant="correct" message="Правильно!" />
      </Section>
    </FixtureLayout>
  )
}
