import { FixtureLayout } from '../../organisms/FixtureLayout'
import { Tooltip, TooltipProvider } from './Tooltip'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </div>
  )
}

export default function TooltipFixture() {
  return (
    <TooltipProvider>
      <FixtureLayout title="Tooltip">
        <Section title="Перелёт между элементами (hover)">
          <Tooltip text="Иконка игры §">
            <span style={{ fontSize: 24, cursor: 'default' }}>{'\u00A7'}</span>
          </Tooltip>
          <Tooltip text="PvP режим">
            <span style={{ fontSize: 24, cursor: 'default' }}>{'\u2694'}</span>
          </Tooltip>
          <Tooltip text="Вопросы">
            <span style={{ fontSize: 24, cursor: 'default' }}>{'\u2692'}</span>
          </Tooltip>
          <Tooltip text="Люди">
            <span style={{ fontSize: 24, cursor: 'default' }}>{'\u262D'}</span>
          </Tooltip>
          <Tooltip text="Рейтинги">
            <span style={{ fontSize: 24, cursor: 'default' }}>{'\u2721'}</span>
          </Tooltip>
        </Section>

        <Section title="Bottom position">
          <Tooltip text="50 вопросов доступно" position="bottom">
            <span style={{ padding: 4, background: '#EDEBD2', borderRadius: 4, fontSize: 12, cursor: 'default' }}>
              50 вопросов
            </span>
          </Tooltip>
          <Tooltip text="Ещё один снизу" position="bottom">
            <span style={{ padding: 4, border: '1px solid #CCC', borderRadius: 4, fontSize: 12, cursor: 'default' }}>
              Подсказка
            </span>
          </Tooltip>
        </Section>

        <Section title="Click trigger">
          <Tooltip text="Подсказка по клику" trigger="click">
            <span style={{ borderBottom: '1px dotted', cursor: 'pointer', fontSize: 14 }}>
              Нажми на меня
            </span>
          </Tooltip>
        </Section>

        <Section title="Left &amp; Right positions">
          <Tooltip text="Слева от элемента" position="left">
            <span style={{ padding: 4, background: '#EDEBD2', borderRadius: 4, fontSize: 12, cursor: 'default' }}>
              Слева
            </span>
          </Tooltip>
          <Tooltip text="Справа от элемента" position="right">
            <span style={{ padding: 4, background: '#EDEBD2', borderRadius: 4, fontSize: 12, cursor: 'default' }}>
              Справа
            </span>
          </Tooltip>
        </Section>
      </FixtureLayout>
    </TooltipProvider>
  )
}
