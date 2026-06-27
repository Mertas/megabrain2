import { FixtureLayout } from '../../organisms/FixtureLayout'
import { useToast } from './ToastContainer'
import { Button } from '../../atoms/Button/Button'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

function Demo() {
  const { show, toasts, remove, ToastContainer } = useToast()

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="primary" size="sm" onClick={() => show({ variant: 'correct', message: 'Правильно!', autoHide: 2000 })}>
          Correct
        </Button>
        <Button variant="danger" size="sm" onClick={() => show({ variant: 'wrong', message: 'Неправильно', autoHide: 2000 })}>
          Wrong
        </Button>
        <Button variant="secondary" size="sm" onClick={() => show({ variant: 'info', message: 'Вы сегодня творите чудеса!' })}>
          Info
        </Button>
        <Button
          size="sm"
          onClick={() => {
            show({ variant: 'correct', message: 'Первый!', autoHide: 3000 })
            setTimeout(() => show({ variant: 'wrong', message: 'Второй', autoHide: 2000 }), 400)
            setTimeout(() => show({ variant: 'info', message: 'Третий, без автоскрытия' }), 800)
          }}
        >
          Три подряд (стек)
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            for (let i = 0; i < 5; i++) {
              setTimeout(() => show({ variant: i % 2 === 0 ? 'correct' : 'wrong', message: `Тост ${i + 1}`, autoHide: 3000 }), i * 200)
            }
          }}
        >
          5 подряд быстро
        </Button>
      </div>
    </div>
  )
}

export default function ToastContainerFixture() {
  return (
    <FixtureLayout title="ToastContainer">
      <Section title="Стек тостов без перезапуска анимаций">
        <Demo />
      </Section>
    </FixtureLayout>
  )
}
