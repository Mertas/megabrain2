import { useState, useMemo, useEffect, useRef } from 'react'
import { TopicList } from '../TopicList/TopicList'
import { TimeSettingRow } from '../../molecules/TimeSettingRow/TimeSettingRow'
import { TimeEstimator } from '../../molecules/TimeEstimator/TimeEstimator'
import { Checkbox } from '../../atoms/Checkbox/Checkbox'
import { Select } from '../../atoms/Select/Select'
import { Button } from '../../atoms/Button/Button'
import { Divider } from '../../atoms/Divider/Divider'
import type { Topic } from '../../molecules/TopicCard/TopicCard'
import type { ApiCategory, SavedGameConfig } from '../../../lib/api'
import styles from './NewGameForm.module.scss'

export interface GameConfig {
  subtopicIds: number[]
  timeMode: 'per_question' | 'per_game'
  timeValueSeconds: number
  questionCount: number
  onlyNew: boolean
}

export interface NewGameFormProps {
  categories: ApiCategory[]
  lastConfig: SavedGameConfig | null
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

export function NewGameForm({ categories, lastConfig, onStart }: NewGameFormProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [timeMode, setTimeMode] = useState<'per_question' | 'per_game'>('per_question')
  const [timeValue, setTimeValue] = useState('60')
  const [questionCount, setQuestionCount] = useState('10')
  const [onlyNew, setOnlyNew] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (!lastConfig || initialized.current) return
    initialized.current = true

    // Restore selected topics (only those that still exist)
    const currentTopicIds = new Set(categories.flatMap((c) => c.topics.map((t) => t.id)))
    const validIds = lastConfig.subtopicIds.filter((id) => currentTopicIds.has(id))
    if (validIds.length > 0) setSelectedIds(validIds)

    setTimeMode(lastConfig.timeMode)
    setTimeValue(lastConfig.timeValue)
    setQuestionCount(lastConfig.questionCount)
    setOnlyNew(lastConfig.onlyNew)
  }, [lastConfig, categories])

  const topics: Topic[] = useMemo(() => categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    subtopics: cat.topics.map((t) => ({ id: t.id, name: t.name })),
  })), [categories])

  const totalQ = useMemo(
    () => categories.reduce((sum, cat) => sum + cat.topics.reduce((s, t) => s + t.question_count, 0), 0),
    [categories],
  )

  const selectedQ = useMemo(() => {
    if (selectedIds.length === 0) return 0
    return categories.reduce((sum, cat) =>
      sum + cat.topics.filter((t) => selectedIds.includes(t.id)).reduce((s, t) => s + t.question_count, 0), 0)
  }, [categories, selectedIds])

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
  const qtyForEstimate = parseInt(questionCount) || selectedQ

  return (
    <div>
      <h1 className={styles.title}>Новая игра</h1>

      <TopicList
        topics={topics}
        selectedIds={selectedIds}
        onSelectSubtopic={(id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
        onSelectAll={handleSelectAll}
        totalQuestions={totalQ}
      />

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Время</h2>
        <p className={styles.sectionDesc}>
          {timeMode === 'per_question' && parseInt(timeValue) > 0 && (
            <span><TimeEstimator mode="per_question" timeSeconds={parseInt(timeValue)} totalItems={qtyForEstimate} /></span>
          )}
          {timeMode === 'per_game' && parseInt(timeValue) > 0 && (
            <span><TimeEstimator mode="per_game" timeSeconds={parseInt(timeValue)} totalItems={qtyForEstimate} /></span>
          )}
          {parseInt(timeValue) === 0 && 'Без ограничений'}
        </p>

        <TimeSettingRow
          name="timing"
          label="На вопрос"
          options={timePerQ}
          defaultChecked={timeMode === 'per_question'}
          value={timeValue}
          onTimeChange={(v) => { setTimeMode('per_question'); setTimeValue(v) }}
        />

        <div className={styles.divider}><Divider label="или" /></div>

        <TimeSettingRow
          name="timing"
          label="На игру"
          options={timePerG}
          defaultChecked={timeMode === 'per_game'}
          value={timeValue}
          onTimeChange={(v) => { setTimeMode('per_game'); setTimeValue(v) }}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Вопросы</h2>
        <div className={styles.optionsRow}>
          <div className={styles.qtyCol}>
            <Select options={qtyOptions} value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} size="lg" fullWidth />
          </div>
          <div className={styles.checkCol}>
            <Checkbox label="Только новые" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          </div>
        </div>
        {selectedQ > 0 && (
          <div className={styles.selectedInfo}>
            Выбрано подтем: {selectedIds.length} · доступно вопросов: {selectedQ}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button variant="primary" size="lg" onClick={handleStart} disabled={!canStart}>
          СТАРТ!
        </Button>
        {!canStart && <div className={styles.hint}>Выберите хотя бы одну подтему</div>}
      </div>
    </div>
  )
}
