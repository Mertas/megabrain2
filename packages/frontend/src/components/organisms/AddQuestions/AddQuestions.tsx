import { useState, useEffect } from 'react'
import { Textarea } from '../../atoms/Textarea/Textarea'
import { Select } from '../../atoms/Select/Select'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Flex } from '../../atoms/Flex/Flex'
import { Text } from '../../atoms/Text/Text'
import { Message } from '../../molecules/Message/Message'
import {
  createAdminCategory, createAdminTopic, fetchAdminCategories,
  type ApiCategory, type ApiTopic,
} from '../../../lib/api'
import styles from './AddQuestions.module.scss'

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
      const noteMatch = line.match(/^[#!]\s*(.+)/)
      if (noteMatch) {
        note = noteMatch[1]
        continue
      }
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

export function AddQuestions({ categories: initialCats }: AddQuestionsProps) {
  const [categories, setCategories] = useState(initialCats)
  const [raw, setRaw] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => { setCategories(initialCats) }, [initialCats])

  const parsed = parseQuestions(raw)

  const handleSubmit = async () => {
    if (!selectedTopic || parsed.length === 0) return
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/topics/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ topicId: Number(selectedTopic), questions: parsed }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`Добавлено ${data.added} вопросов!`)
        setRaw('')
      } else {
        setError(data.message || data.error || 'Ошибка')
      }
    } catch {
      setError('Ошибка соединения с сервером')
    }
    setLoading(false)
  }

  const handleCreateTopic = async () => {
    const catName = newCategoryName.trim()
    const tName = newTopicName.trim()
    if (!catName || !tName) return

    setCreating(true)
    setMessage('')
    setError('')

    try {
      let catId = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase())?.id
      if (!catId) {
        const result = await createAdminCategory(catName)
        catId = result.id
      }

      const result = await createAdminTopic(catId, tName)

      const fresh = await fetchAdminCategories()
      setCategories(fresh)

      setSelectedTopic(String(result.id))
      setNewCategoryName('')
      setNewTopicName('')
      setMessage(`Тема "${tName}" создана и выбрана`)
    } catch (err: unknown) {
      setError((err as Error).message || 'Не удалось создать тему')
    }
    setCreating(false)
  }

  const topicOptions = categories.flatMap((c) =>
    c.topics.map((t) => ({ value: String(t.id), label: `${c.name} → ${t.name}` })),
  )

  return (
    <div>
      <h1>Добавление вопросов</h1>

      <Flex gap={16} wrap className={styles.sectionRow}>
        <div className={styles.topicCol}>
          <Select
            label="Тема"
            options={topicOptions}
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            placeholder="Выберите тему"
          />
        </div>
      </Flex>

      <Flex gap={16} wrap align="end" className={styles.sectionRow}>
        <div className={styles.createCol}>
          <Input
            label="Новая категория"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Например: Биология"
          />
        </div>
        <div className={styles.createCol}>
          <Input
            label="Новая тема"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            placeholder="Например: Генетика"
          />
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={handleCreateTopic}
          disabled={!newCategoryName.trim() || !newTopicName.trim() || creating}
          loading={creating}
        >
          Создать тему
        </Button>
      </Flex>

      <Text variant="muted" size="md" as="div">
        Вставьте вопросы: первая строка — вопрос, затем варианты. Правильный ответ — звёздочка *. Строка с # в начале — примечание. Вопросы разделяются пустой строкой.
      </Text>

      <Text variant="muted" size="sm" as="div">
        Пример: «Какой соус основной в китайской кухне?» — «*1. Соевый», «2. Устричный», «3. Рыбный», «4. Хойсин», «# Самый популярный соус в Азии». Звёздочка перед номером — правильный ответ. Можно сколько угодно, лишь бы пустые строки между вопросами не забывали.
      </Text>

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

      <Text variant="muted" className={styles.parsedCount}>Распознано: {parsed.length} вопросов</Text>

      {message && <Message variant="success">{message}</Message>}
      {error && <Message variant="error">{error}</Message>}

      <Flex gap={8} align="center" className={styles.submitRow}>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!selectedTopic || parsed.length === 0 || loading}
          loading={loading}
        >
          Добавить {parsed.length} вопросов
        </Button>
      </Flex>

      {parsed.length > 0 && (
        <div className={styles.preview}>
          <h3 className={styles.previewTitle}>Предпросмотр ({parsed.length})</h3>
          {parsed.map((q, i) => (
            <div key={i} className={styles.previewCard}>
              <div className={styles.previewQ}><strong>{i + 1}.</strong> {q.text}</div>
              {q.answers.map((a, j) => (
                <div key={j} className={`${styles.previewAnswer} ${j === q.correctIndex ? styles.previewCorrect : ''}`}>
                  {j === q.correctIndex ? '✓ ' : '  '} {j + 1}. {a}
                </div>
              ))}
              {q.note && <div className={styles.previewNote}>{q.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
