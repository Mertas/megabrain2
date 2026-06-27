import { useState } from 'react'
import { TopicList } from '../TopicList/TopicList'
import { TimeSettingRow } from '../../molecules/TimeSettingRow/TimeSettingRow'
import { TimeEstimator } from '../../molecules/TimeEstimator/TimeEstimator'
import { Checkbox } from '../../atoms/Checkbox/Checkbox'
import { Select } from '../../atoms/Select/Select'
import { Button } from '../../atoms/Button/Button'
import { Divider } from '../../atoms/Divider/Divider'
import type { Topic } from '../../molecules/TopicCard/TopicCard'
import type { ApiCategory } from '../../../lib/api'

export interface GameConfig {
  subtopicIds: number[]
  timeMode: 'per_question' | 'per_game'
  timeValueSeconds: number
  questionCount: number
  onlyNew: boolean
}

export interface NewGameFormProps {
  categories: ApiCategory[]
  onStart: (config: GameConfig) => void
}

const timePerQ = [
  { value: '10', label: '10 секунд' },
  { value: '30', label: '30 секунд' },
  { value: '60', label: '1 минута' },
  { value: '300', label: '5 минут' },
  { value: '0', label: 'без ограничений' },
]

const timePerG = [
  { value: '300', label: '5 минут' },
  { value: '600', label: '10 минут' },
  { value: '1800', label: '30 минут' },
  { value: '3600', label: '1 час' },
  { value: '0', label: 'без ограничений' },
]

const qtyOptions = [
  { value: '10', label: '10 вопросов' },
  { value: '20', label: '20 вопросов' },
  { value: '50', label: '50 вопросов' },
  { value: '100', label: '100 вопросов' },
  { value: '0', label: 'все вопросы' },
]

export function NewGameForm({ categories, onStart }: NewGameFormProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [timeMode, setTimeMode] = useState<'per_question' | 'per_game'>('per_question')
  const [timeValue, setTimeValue] = useState('60')
  const [questionCount, setQuestionCount] = useState('10')
  const [onlyNew, setOnlyNew] = useState(false)

  // Convert categories to Topic[] format
  const topics: Topic[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    subtopics: cat.topics.map((t) => ({ id: t.id, name: t.name })),
  }))

  const totalQ = topics.reduce((sum, t) => sum + t.subtopics.length * (t.subtopics[0] ? 20 : 0), 0)

  const handleSelectAll = (topicId: number) => {
    const topic = topics.find((t) => t.id === topicId)!
    const ids = topic.subtopics.map((s) => s.id)
    const allSelected = ids.every((id) => selectedIds.includes(id))
    setSelectedIds((prev) => allSelected ? prev.filter((x) => !ids.includes(x)) : [...new Set([...prev, ...ids])])
  }

  const handleStart = () => {
    if (selectedIds.length === 0) return
    onStart({
      subtopicIds: selectedIds,
      timeMode,
      timeValueSeconds: parseInt(timeValue) || 0,
      questionCount: parseInt(questionCount) || 0,
      onlyNew,
    })
  }

  const canStart = selectedIds.length > 0

  return (
    <div>
      <h1>Начать игру</h1>

      <TopicList
        topics={topics}
        selectedIds={selectedIds}
        onSelectSubtopic={(id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
        onSelectAll={handleSelectAll}
        totalQuestions={totalQ}
      />

      <div style={{ display: 'flex', gap: '2%', marginBottom: 24 }}>
        <div style={{ width: '60%' }}>
          <TimeSettingRow
            name="timing"
            label="на вопрос"
            hint={parseInt(timeValue) > 0
              ? <span>(<TimeEstimator mode="per_question" timeSeconds={parseInt(timeValue)} totalItems={parseInt(questionCount) || 20} />)</span>
              : <span>(—)</span>
            }
            options={timePerQ}
            defaultChecked={timeMode === 'per_question'}
            value={timeValue}
            onTimeChange={(v) => { setTimeMode('per_question'); setTimeValue(v) }}
          />
          <div style={{ margin: '4px 0 8px' }}><Divider label="или" /></div>
          <TimeSettingRow
            name="timing"
            label="на игру"
            hint={parseInt(timeValue) > 0 && timeMode === 'per_game'
              ? <span>(<TimeEstimator mode="per_game" timeSeconds={parseInt(timeValue)} totalItems={parseInt(questionCount) || 20} />)</span>
              : <span>(—)</span>
            }
            options={timePerG}
            value={timeValue}
            onTimeChange={(v) => { setTimeMode('per_game'); setTimeValue(v) }}
          />
        </div>
        <div style={{ width: '38%' }}>
          <div style={{ marginBottom: 10 }}>
            <Checkbox label={`только новые${onlyNew ? ' (159)' : ''}`} checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          </div>
          <Select options={qtyOptions} value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} />
        </div>
      </div>
      <div className="clear" />

      <div style={{ textAlign: 'center' }}>
        <Button variant="primary" size="lg" onClick={handleStart} disabled={!canStart}>
          {canStart ? 'СТАРТ!' : 'Выберите темы'}
        </Button>
        {!canStart && <div style={{ color: '#FF6633', fontSize: 12, marginTop: 8 }}>Выберите хотя бы одну подтему</div>}
      </div>
    </div>
  )
}
