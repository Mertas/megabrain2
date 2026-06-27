import { useState } from 'react'
import { Textarea } from '../../atoms/Textarea/Textarea'
import { Select } from '../../atoms/Select/Select'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import type { ApiCategory, ApiTopic } from '../../../lib/api'

interface ParsedQuestion {
  text: string
  answers: string[]
  correctIndex: number
  note?: string
}

function parseQuestions(raw: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  const blocks = raw.trim().split(/\n{2,}/)

  for (const block of blocks) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 3) continue

    const questionText = lines[0]
    const answers: string[] = []
    let correctIndex = 0
    let note = ''

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      // Note line
      const noteMatch = line.match(/^[#!]\s*(.+)/)
      if (noteMatch) {
        note = noteMatch[1]
        continue
      }
      // Answer line
      const match = line.match(/^(\*)?\s*\d+\.?\s*(.+)/)
      if (!match) continue
      const [, star, text] = match
      if (star === '*') correctIndex = answers.length
      answers.push(text.trim())
    }

    if (answers.length >= 2 && questionText) {
      const q: ParsedQuestion = { text: questionText, answers, correctIndex }
      if (note) q.note = note
      questions.push(q)
    }
  }

  return questions
}

export interface AddQuestionsProps {
  categories: ApiCategory[]
  topics: ApiTopic[]
}

export function AddQuestions({ categories, topics: _topics }: AddQuestionsProps) {
  const [raw, setRaw] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const parsed = parseQuestions(raw)

  const handleSubmit = async () => {
    if (!selectedTopic || parsed.length === 0) return
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('http://localhost:3001/api/topics/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ topicId: Number(selectedTopic), questions: parsed }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Добавлено ${data.added} вопросов!`)
        setRaw('')
      } else {
        setMessage(`Ошибка: ${data.message || data.error}`)
      }
    } catch {
      setMessage('Ошибка соединения с сервером')
    }
    setLoading(false)
  }

  const topicOptions = categories.flatMap((c) =>
    c.topics.map((t) => ({ value: String(t.id), label: `${c.name} → ${t.name}` })),
  )

  return (
    <div>
      <h1>Добавление вопросов</h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 300 }}>
          <Select
            label="Тема"
            options={topicOptions}
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            placeholder="Выберите тему"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <Input
          label="Новая категория"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Например: Биология"
          style={{ flex: 1, minWidth: 200 }}
        />
        <Input
          label="Новая тема"
          value={newTopicName}
          onChange={(e) => setNewTopicName(e.target.value)}
          placeholder="Например: Генетика"
          style={{ flex: 1, minWidth: 200 }}
        />
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={() => {
            if (newCategoryName && newTopicName) {
              setMessage(`Тема "${newTopicName}" в категории "${newCategoryName}" будет создана при первом добавлении вопроса.`)
            }
          }}>
            + Создать тему
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: 12, fontSize: 14, color: '#666' }}>
        Вставьте вопросы: первая строка — вопрос, затем варианты. Правильный ответ — звёздочка *.
        Строка с # в начале — примечание. Вопросы разделяются пустой строкой.
      </div>

      <Textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={`Какой соус основной в китайской кухне?\n*1. Соевый\n2. Устричный\n3. Рыбный\n4. Хойсин\n# Самый популярный соус в Азии\n\nКакая планета ближе всего к Солнцу?\n*1. Меркурий\n2. Венера\n3. Земля\n4. Марс`}
        rows={12}
        size="lg"
        fullWidth
        autoResize
        minRows={6}
        maxRows={30}
      />

      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
        Распознано: {parsed.length} вопросов
      </div>

      {message && (
        <div style={{ marginTop: 12, padding: 8, borderRadius: 4, fontSize: 12, color: message.startsWith('Добавлено') ? '#37CE74' : '#FF0000', border: `1px solid ${message.startsWith('Добавлено') ? '#37CE74' : '#FF0000'}`, background: message.startsWith('Добавлено') ? 'rgba(55,206,116,0.1)' : 'rgba(255,0,0,0.05)' }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!selectedTopic || parsed.length === 0 || loading}
        >
          {loading ? 'Добавление...' : `Добавить ${parsed.length} вопросов`}
        </Button>
      </div>

      {parsed.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Предпросмотр ({parsed.length})</h3>
          {parsed.map((q, i) => (
            <div key={i} style={{ marginBottom: 16, padding: 12, border: '1px solid #EEE', borderRadius: 6 }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}><strong>{i + 1}.</strong> {q.text}</div>
              {q.answers.map((a, j) => (
                <div key={j} style={{ fontSize: 14, marginLeft: 20, color: j === q.correctIndex ? '#37CE74' : '#333' }}>
                  {j === q.correctIndex ? '✓ ' : '  '} {j + 1}. {a}
                </div>
              ))}
              {q.note && (
                <div style={{ fontSize: 12, marginLeft: 20, marginTop: 6, color: '#999', fontStyle: 'italic' }}>
                  📝 {q.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
