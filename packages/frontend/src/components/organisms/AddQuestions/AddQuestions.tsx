import { useState, useEffect } from 'react'
import { Textarea } from '../../atoms/Textarea/Textarea'
import { Select } from '../../atoms/Select/Select'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Flex } from '../../atoms/Flex/Flex'
import { Text } from '../../atoms/Text/Text'
import { Divider } from '../../atoms/Divider/Divider'
import { Message } from '../../molecules/Message/Message'
import {
  createAdminCategory, createAdminTopic, fetchAdminCategories,
  type ApiCategory, type ApiTopic,
} from '../../../lib/api'
import styles from './AddQuestions.module.scss'

interface QData {
  text: string
  answers: string[]
  correctIndex: number
  note?: string
}

interface Candidate {
  source: 'new' | 'existing'
  index?: number
  id?: number
  question: QData
  matchField?: string
}

interface DupGroup {
  candidates: Candidate[]
}

interface EditableQ extends QData {
  dirty: boolean
}

function parseQuestions(raw: string): QData[] {
  const questions: QData[] = []
  const blocks = raw.trim().split(/\n{2,}/)
  for (const block of blocks) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 3) continue
    const text = lines[0]
    const answers: string[] = []
    let correctIndex = 0
    let note = ''
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const nm = line.match(/^[#!]\s*(.+)/)
      if (nm) { note = nm[1]; continue }
      const m = line.match(/^(\*)?\s*\d+\.?\s*(.+)/)
      if (!m) continue
      if (m[1] === '*') correctIndex = answers.length
      answers.push(m[2].trim())
    }
    if (answers.length >= 2 && text) {
      const q: QData = { text, answers, correctIndex }
      if (note) q.note = note
      questions.push(q)
    }
  }
  return questions
}

export interface AddQuestionsProps { categories: ApiCategory[]; topics: ApiTopic[] }
export function AddQuestions({ categories: initialCats }: AddQuestionsProps) {
  const [categories, setCategories] = useState(initialCats)
  const [raw, setRaw] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [ncName, setNcName] = useState('')
  const [ntName, setNtName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const [groups, setGroups] = useState<DupGroup[]>([])
  const [cleanIndices, setCleanIndices] = useState<number[]>([])
  const [edits, setEdits] = useState<Record<string, EditableQ>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showReview, setShowReview] = useState(false)

  useEffect(() => { setCategories(initialCats) }, [initialCats])
  const parsed = parseQuestions(raw)

  const candidateKey = (c: Candidate) => c.source === 'new' ? `new-${c.index}` : `existing-${c.id}`

  const getQ = (c: Candidate): EditableQ => {
    const key = candidateKey(c)
    return edits[key] || { ...c.question, dirty: false }
  }

  const setQ = (c: Candidate, q: EditableQ) => {
    setEdits((p) => ({ ...p, [candidateKey(c)]: q }))
  }

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const reset = () => {
    setGroups([]); setCleanIndices([]); setEdits({}); setSelected(new Set()); setShowReview(false)
  }

  const handleCheck = async () => {
    if (!selectedTopic || parsed.length === 0) return
    setLoading(true); setMessage(''); setError(''); reset()
    try {
      const res = await fetch('/api/topics/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ topicId: Number(selectedTopic), questions: parsed }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Ошибка'); setLoading(false); return }

      setGroups(data.groups || [])
      setCleanIndices(data.cleanIndices || [])

      // Pre-select existing candidates (keep them by default), leave new unchecked
      const sel = new Set<string>()
      for (const g of data.groups || []) {
        for (const c of g.candidates) {
          if (c.source === 'existing') sel.add(candidateKey(c))
        }
      }
      setSelected(sel)
      setShowReview(true)

      const n = (data.groups || []).length
      setMessage(n > 0 ? `Найдено ${n} групп дубликатов. Отметьте нужные.` : 'Дубликатов нет.')
    } catch { setError('Ошибка соединения') }
    setLoading(false)
  }

  const handleSubmit = async () => {
    const inserts: QData[] = []
    const updates: Array<QData & { id: number }> = []

    for (const g of groups) {
      for (const c of g.candidates) {
        if (!selected.has(candidateKey(c))) continue
        const q = getQ(c)
        if (c.source === 'new') {
          inserts.push({ text: q.text, answers: q.answers, correctIndex: q.correctIndex, note: q.note })
        } else if (c.source === 'existing') {
          updates.push({ id: c.id!, text: q.text, answers: q.answers, correctIndex: q.correctIndex, note: q.note })
        }
      }
    }

    for (const i of cleanIndices) {
      const q = parsed[i]
      if (q) inserts.push(q)
    }

    if (inserts.length === 0 && updates.length === 0) {
      setError('Нет выбранных вопросов'); return
    }

    setLoading(true); setMessage(''); setError('')
    try {
      const res = await fetch('/api/topics/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({
          topicId: Number(selectedTopic),
          insert: inserts.length > 0 ? inserts : undefined,
          update: updates.length > 0 ? updates : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const parts: string[] = []
        if (data.added) parts.push(`добавлено ${data.added}`)
        if (data.updated) parts.push(`обновлено ${data.updated}`)
        setMessage(parts.join(', ') + '!')
        setRaw(''); reset()
      } else {
        setError(data.message || 'Ошибка')
      }
    } catch { setError('Ошибка соединения') }
    setLoading(false)
  }

  const handleCreateTopic = async () => {
    const cn = ncName.trim(); const tn = ntName.trim()
    if (!cn || !tn) return
    setCreating(true); setMessage(''); setError('')
    try {
      let cid = categories.find((c) => c.name.toLowerCase() === cn.toLowerCase())?.id
      if (!cid) { const r = await createAdminCategory(cn); cid = r.id }
      const r = await createAdminTopic(cid, tn)
      setCategories(await fetchAdminCategories())
      setSelectedTopic(String(r.id)); setNcName(''); setNtName('')
      setMessage(`Тема "${tn}" создана и выбрана`)
    } catch (e: unknown) { setError((e as Error).message || 'Не удалось') }
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
          <Select label="Тема" options={topicOptions} value={selectedTopic}
            onChange={(e) => { setSelectedTopic(e.target.value); reset() }} placeholder="Выберите тему" />
        </div>
      </Flex>

      <Flex gap={16} wrap align="end" className={styles.sectionRow}>
        <div className={styles.createCol}><Input label="Новая категория" value={ncName} onChange={(e) => setNcName(e.target.value)} placeholder="Например: Биология" /></div>
        <div className={styles.createCol}><Input label="Новая тема" value={ntName} onChange={(e) => setNtName(e.target.value)} placeholder="Например: Генетика" /></div>
        <Button variant="secondary" size="md" onClick={handleCreateTopic} disabled={!ncName.trim() || !ntName.trim() || creating} loading={creating}>Создать тему</Button>
      </Flex>

      {!showReview && (
        <>
          <Text variant="muted" size="md" as="div">Вставьте вопросы. Первая строка — вопрос, затем варианты с *. # — примечание. Разделитель — пустая строка.</Text>
          <Textarea value={raw} onChange={(e) => setRaw(e.target.value)}
            placeholder={`Какой соус основной в китайской кухне?\n*1. Соевый\n2. Устричный\n3. Рыбный\n4. Хойсин\n# Самый популярный соус в Азии`}
            rows={12} size="lg" fullWidth autoResize minRows={6} maxRows={30} />
          <Text variant="muted" className={styles.parsedCount}>{parsed.length} вопросов</Text>

          {message && <Message variant="success">{message}</Message>}
          {error && <Message variant="error">{error}</Message>}

          <Flex gap={8} align="center" className={styles.submitRow}>
            <Button variant="primary" size="lg" onClick={handleCheck}
              disabled={!selectedTopic || parsed.length === 0 || loading} loading={loading}>
              Проверить {parsed.length} вопросов
            </Button>
          </Flex>
        </>
      )}

      {showReview && (
        <div className={styles.reviewBlock}>
          {message && <Message variant="success">{message}</Message>}
          {error && <Message variant="error">{error}</Message>}

          {groups.map((g, gi) => (
            <div key={gi}>
              <div className={styles.groupHeader}>
                <span className={styles.groupIdx}>Группа #{gi + 1}</span>
                <span className={styles.groupCount}>{g.candidates.length} варианта</span>
              </div>

              <div className={styles.candidatesGrid}>
                {g.candidates.map((c) => {
                  const key = candidateKey(c)
                  const q = getQ(c)
                  const isSelected = selected.has(key)
                  const label = c.source === 'new'
                    ? `Новый #${(c.index ?? 0) + 1}`
                    : `Существующий #${c.id}`

                  return (
                    <div key={key} className={`${styles.candidateRow} ${isSelected ? styles.candidateSelected : ''}`}>
                      <label className={styles.candidateCheck}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggle(key)} />
                        <span className={styles.candidateLabel}>{label}</span>
                        {c.matchField && <span className={styles.matchTag}>{c.matchField === 'text' ? 'текст' : 'ответ'}</span>}
                      </label>

                      <Input value={q.text}
                        onChange={(e) => setQ(c, { ...q, text: e.target.value, dirty: true })}
                        className={c.matchField === 'text' && c.source === 'existing' ? styles.matchInput : ''} />
                      <div className={styles.inlineAnswers}>
                        {q.answers.map((a, ai) => (
                          <label key={ai} className={`${styles.inlineAnswer} ${q.correctIndex === ai ? styles.inlineCorrect : ''}`}>
                            <input type="radio" name={`correct-${key}`} checked={q.correctIndex === ai}
                              onChange={() => setQ(c, { ...q, correctIndex: ai, dirty: true })} />
                            <Input value={a} size="sm"
                              onChange={(e) => { const na = [...q.answers]; na[ai] = e.target.value; setQ(c, { ...q, answers: na, dirty: true }) }}
                              className={c.matchField === 'correctAnswer' && q.correctIndex === ai ? styles.matchInput : ''} />
                          </label>
                        ))}
                      </div>
                      <Input value={q.note || ''} size="sm" placeholder="Примечание"
                        onChange={(e) => setQ(c, { ...q, note: e.target.value, dirty: true })} />
                    </div>
                  )
                })}
              </div>
              <Divider spacing="sm" />
            </div>
          ))}

          {cleanIndices.length > 0 && (
            <>
              <Divider spacing="sm" />
              <div className={styles.cleanSection}>
                <span className={styles.groupIdx}>Чистые ({cleanIndices.length})</span>
                <div className={styles.cleanGrid}>
                  {cleanIndices.map((i) => (
                    <div key={i} className={styles.cleanItem}>
                      <strong>#{i + 1}</strong> {parsed[i]?.text}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Flex gap={12} className={styles.submitRow}>
            <Button variant="primary" size="lg" onClick={handleSubmit} loading={loading}>Сохранить</Button>
            <Button variant="ghost" size="md" onClick={reset}>Назад</Button>
          </Flex>
        </div>
      )}
    </div>
  )
}
