import { useState } from 'react'
import { Tabs } from '../../molecules/Tabs/Tabs'
import { Textarea } from '../../atoms/Textarea/Textarea'
import { Input } from '../../atoms/Input/Input'
import { FileInput } from '../../atoms/FileInput/FileInput'
import { Button } from '../../atoms/Button/Button'
import { FieldNote } from '../../atoms/FieldNote/FieldNote'
import { SearchCheck } from '../../molecules/SearchCheck/SearchCheck'
import type { Topic } from '../../molecules/TopicCard/TopicCard'
import { PageHeader } from '../../molecules/PageHeader/PageHeader'
import styles from './NewQuestionForm.module.scss'

export interface NewQuestionFormProps {
  topics: Topic[]
  onSubmit: (data: {
    text: string
    answers: [string, string, string, string]
    correctIndex: number
    subtopicIds: number[]
  }) => void
}

const mediaTabs = [
  { key: 'file', label: '\u266B файл', title: 'mp3, flv-видео или картинки gif, jpg, png' },
  { key: 'uri', label: 'ссылка на \u266B файл' },
  { key: 'video', label: 'youtube-видео' },
]

export function NewQuestionForm({ topics: _topics, onSubmit }: NewQuestionFormProps) {
  const [text, setText] = useState('')
  const [answers, setAnswers] = useState<[string, string, string, string]>(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [mediaTab, setMediaTab] = useState('file')

  const handleSubmit = () => {
    if (!text.trim() || answers.some((a) => !a.trim())) return
    onSubmit({ text, answers, correctIndex, subtopicIds: [] })
  }

  return (
    <div>
      <PageHeader title="Новый вопрос" />

      <div style={{ marginBottom: 16 }}>
        <Tabs items={mediaTabs} activeKey={mediaTab} onChange={setMediaTab}>
          {mediaTab === 'file' && (
            <div>
              <FileInput buttonText="Выбрать файл" />
            </div>
          )}
          {mediaTab === 'uri' && <Input placeholder="https://example.com/pic.jpg" />}
          {mediaTab === 'video' && <Input placeholder="https://youtube.com/watch?v=..." />}
        </Tabs>
        <FieldNote>Ваше неотъемлемое право на подсказку на картинке сохраняется <a href="#">законами</a></FieldNote>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Textarea
          label="Вопрос"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Вопрос, сформулированный точно, кратко и недвусмысленно*"
          autoResize
          minRows={4}
          maxRows={18}
          size="lg"
          fullWidth
        />
        <FieldNote>*в разумных пределах, конечно ;)</FieldNote>
      </div>

      <div className={styles.answers}>
        {answers.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontSize: 19, width: 24 }}>{i + 1}.</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Textarea
                value={a}
                onChange={(e) => {
                  const next = [...answers] as [string, string, string, string]
                  next[i] = e.target.value.replace(/\n+/g, ' ')
                  setAnswers(next)
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) e.preventDefault() }}
                placeholder={['Смешной ответ', 'Верный ответ', 'Очевидный ответ', 'Раздражающий ответ'][i]}
                autoResize
                minRows={1}
                maxRows={8}
                fullWidth
              />
            </div>
            <Button
              variant={correctIndex === i ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCorrectIndex(i)}
            >
              {correctIndex === i ? '✓ Верный' : 'Верный'}
            </Button>
          </div>
        ))}
      </div>

      <SearchCheck questionText={text} />

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Button variant="primary" size="lg" onClick={handleSubmit}>Добавить вопрос!</Button>
      </div>
    </div>
  )
}
