import { useState, useMemo, useEffect, useRef } from 'react'
import { TopicList } from '../TopicList/TopicList'
import { PageHeader } from '../../molecules/PageHeader/PageHeader'
import { ConfigCard } from '../../molecules/ConfigCard/ConfigCard'
import { TimeSettingRow } from '../../molecules/TimeSettingRow/TimeSettingRow'
import { TimeEstimator } from '../../molecules/TimeEstimator/TimeEstimator'
import { Checkbox } from '../../atoms/Checkbox/Checkbox'
import { Select } from '../../atoms/Select/Select'
import { Button } from '../../atoms/Button/Button'
import { PowerupSelector } from '../../molecules/PowerupSelector/PowerupSelector'
import { fetchPowerupTypes, type PowerupType } from '../../../lib/api'
import type { Topic } from '../../molecules/TopicCard/TopicCard'
import type { ApiCategory, SavedGameConfig } from '../../../lib/api'
import styles from './NewGameForm.module.scss'

export interface GameConfig {
  subtopicIds: number[]
  timeMode: 'per_question' | 'per_game'
  timeValueSeconds: number
  questionCount: number
  onlyNew: boolean
  powerupIds: string[]
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

const soloRules = [
  { icon: '\u23F1', text: 'Очки зависят от скорости: чем быстрее ответ, тем больше очков (до 10 за вопрос)' },
  { icon: '\u{1F525}', text: 'Серия правильных ответов даёт множитель очков (стрик)' },
  { icon: '\u{1F4CA}', text: 'Время можно задать на вопрос или на всю игру целиком' },
  { icon: '\u{1F3AF}', text: 'Выберите количество вопросов и темы — игра подберёт случайные вопросы' },
]

export function NewGameForm({ categories, lastConfig, onStart }: NewGameFormProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [timeMode, setTimeMode] = useState<'per_question' | 'per_game'>('per_question')
  const [timeValue, setTimeValue] = useState('60')
  const [questionCount, setQuestionCount] = useState('10')
  const [onlyNew, setOnlyNew] = useState(false)
  const initialized = useRef(false)
  const [powerupTypes, setPowerupTypes] = useState<PowerupType[]>([])
  const [selectedPowerups, setSelectedPowerups] = useState<string[]>([])

  useEffect(() => {
    fetchPowerupTypes().then((types) => {
      setPowerupTypes(types.filter((t) => t.category === 'utility' || t.category === 'defensive'))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!lastConfig || initialized.current) return
    initialized.current = true
    const currentTopicIds = new Set(categories.flatMap((c) => c.topics.map((t) => t.id)))
    const validIds = lastConfig.subtopicIds.filter((id) => currentTopicIds.has(id))
    if (validIds.length > 0) setSelectedIds(validIds)
    setTimeMode(lastConfig.timeMode)
    setTimeValue(lastConfig.timeValue)
    setQuestionCount(lastConfig.questionCount)
    setOnlyNew(lastConfig.onlyNew)
  }, [lastConfig, categories])

  const topics: Topic[] = useMemo(() => categories.map((cat) => ({
    id: cat.id, name: cat.name, icon: cat.icon,
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
      subtopicIds: selectedIds, timeMode,
      timeValueSeconds: parseInt(timeValue) || 0,
      questionCount: parseInt(questionCount) || 0, onlyNew,
      powerupIds: selectedPowerups,
    })
  }

  const canStart = selectedIds.length > 0
  const qtyForEstimate = parseInt(questionCount) || selectedQ

  return (
    <div className={styles.wrap}>
      <PageHeader icon="§" title="Новая игра" description="Классическая викторина. Выберите темы, настройте время и количество вопросов." rules={soloRules} />

      

      <TopicList
        topics={topics}
        selectedIds={selectedIds}
        onSelectSubtopic={(id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
        onSelectAll={handleSelectAll}
        totalQuestions={totalQ}
      />

      <ConfigCard>
        <Select label="Количество вопросов" hint="Сколько вопросов будет в игре. 10 — быстрая разминка, 50 — марафон, 100 — на весь вечер." options={qtyOptions} value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} data-testid="question-count" />

        <div className={styles.optionsRow}>
          <Checkbox label="Только новые" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          {selectedQ > 0 && (
            <span className={styles.selectedInfo}>Выбрано подтем: {selectedIds.length} · доступно вопросов: {selectedQ}</span>
          )}
        </div>

        <p className={styles.estimate}>
          {timeMode === 'per_question' && parseInt(timeValue) > 0 && (
            <TimeEstimator mode="per_question" timeSeconds={parseInt(timeValue)} totalItems={qtyForEstimate} />
          )}
          {timeMode === 'per_game' && parseInt(timeValue) > 0 && (
            <TimeEstimator mode="per_game" timeSeconds={parseInt(timeValue)} totalItems={qtyForEstimate} />
          )}
          {parseInt(timeValue) === 0 && 'Без ограничения времени'}
        </p>

        <TimeSettingRow name="timing" label="На вопрос" options={timePerQ} defaultChecked={timeMode === 'per_question'} value={timeValue} onTimeChange={(v) => { setTimeMode('per_question'); setTimeValue(v) }} />
        <TimeSettingRow name="timing" label="На игру" options={timePerG} defaultChecked={timeMode === 'per_game'} value={timeValue} onTimeChange={(v) => { setTimeMode('per_game'); setTimeValue(v) }} />
      </ConfigCard>

      {powerupTypes.length > 0 && (
        <PowerupSelector types={powerupTypes} selected={selectedPowerups} onChange={setSelectedPowerups} />
      )}

      <div className={styles.actions}>
        <Button variant="primary" size="lg" onClick={handleStart} disabled={!canStart} data-testid="solo-start">Начать игру</Button>
        <Button variant="link" size="sm" onClick={() => window.location.href = '/powerups'}>
          {'\u2728'} Магазин Power-ups
        </Button>
        {!canStart && <div className={styles.hint}>Выберите хотя бы одну подтему</div>}
      </div>
    </div>
  )
}
