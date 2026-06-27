import { FixtureLayout } from '../../organisms/FixtureLayout'
import { AnswerResultItem } from './AnswerResultItem'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  )
}

export default function AnswerResultItemFixture() {
  return (
    <FixtureLayout title="AnswerResultItem">
      <Section title="Ответил правильно">
        <AnswerResultItem
          index={0}
          question="На какой планете находится самая высокая гора в Солнечной системе?"
          imageUrl="/i/sample_question_pic.jpg"
          answers={['Марс', 'Уран', 'Венера', 'Нептун']}
          correctIndex={0}
          selectedIndex={0}
          explanation="Гора Олимп (лат. Olympus Mons) — потухший вулкан на Марсе, самая высокая гора в Солнечной системе. Высота — 21.2 км по отношению к его основанию."
          explanationSource="http://ru.wikipedia.org/wiki/Olympus_Mons"
          onReportMistake={() => {}}
        />
      </Section>

      <Section title="Ответил неправильно">
        <AnswerResultItem
          index={1}
          question="У какой планеты солнечной системы больше всего лун?"
          imageUrl="/i/sample_question_pic_2.jpg"
          answers={['Юпитер', 'Уран', 'Венера', 'Нептун']}
          correctIndex={0}
          selectedIndex={3}
          explanation="У Юпитера — 63 спутника, у Урана — 27, у Нептуна — 13."
          onReportMistake={() => {}}
        />
      </Section>

      <Section title="Без картинки, без пояснения">
        <AnswerResultItem
          index={2}
          question="Сколько планет в Солнечной системе?"
          answers={['7', '8', '9', '10']}
          correctIndex={1}
          selectedIndex={1}
        />
      </Section>

      <Section title="Список результатов (4 вопроса)">
        {[
          { q: 'На какой планете самая высокая гора?', a: ['Марс', 'Уран', 'Венера', 'Нептун'], cor: 0, sel: 0 },
          { q: 'У какой планеты больше всего лун?', a: ['Юпитер', 'Уран', 'Венера', 'Нептун'], cor: 0, sel: 3 },
          { q: 'Сколько планет в Солнечной системе?', a: ['7', '8', '9', '10'], cor: 1, sel: 1 },
          { q: 'Ближайшая к Солнцу планета?', a: ['Меркурий', 'Венера', 'Земля', 'Марс'], cor: 0, sel: 2 },
        ].map((item, i) => (
          <AnswerResultItem
            key={i}
            index={i}
            question={item.q}
            answers={item.a}
            correctIndex={item.cor}
            selectedIndex={item.sel}
          />
        ))}
      </Section>
    </FixtureLayout>
  )
}
