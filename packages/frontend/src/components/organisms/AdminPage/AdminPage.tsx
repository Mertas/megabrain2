import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Table, type TableColumn } from '../../molecules/Table/Table'
import { Tabs } from '../../molecules/Tabs/Tabs'
import { Paginator } from '../../molecules/Paginator/Paginator'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Select } from '../../atoms/Select/Select'
import { Textarea } from '../../atoms/Textarea/Textarea'
import { SearchForm } from '../../molecules/SearchForm/SearchForm'
import { Spinner } from '../../atoms/Spinner/Spinner'
import {
  fetchAdminQuestions, updateAdminQuestion, deleteAdminQuestion,
  fetchAdminCategories, createAdminCategory, deleteAdminCategory,
  createAdminTopic, deleteAdminTopic,
  fetchAdminUsers, updateAdminUser,
  type AdminQuestion, type AdminCategory, type AdminUser, type AdminPageResult,
} from '../../../lib/api'
import styles from './AdminPage.module.scss'
import { PageHeader } from '../../molecules/PageHeader/PageHeader'

type Tab = 'questions' | 'categories' | 'users'

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('questions')

  return (
    <div>
      <PageHeader title="Админка" />
      <Tabs
        items={[
          { key: 'questions', label: 'Вопросы' },
          { key: 'categories', label: 'Категории' },
          { key: 'users', label: 'Пользователи' },
        ]}
        activeKey={tab}
        onChange={(k) => setTab(k as Tab)}
      />
      <div className={styles.content}>
        {tab === 'questions' && <QuestionsTab />}
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'users' && <UsersTab />}
      </div>
    </div>
  )
}

// ===================== Questions Tab =====================

type Draft = Partial<AdminQuestion>
type RowState = 'saving' | 'saved' | 'error'

const EDITABLE: (keyof AdminQuestion)[] = ['text', 'answer_1', 'answer_2', 'answer_3', 'answer_4', 'correct_index', 'explanation', 'note']

function changedFields(q: AdminQuestion, draft: Draft): Draft {
  const out: Draft = {}
  for (const key of EDITABLE) {
    const next = draft[key]
    if (next === undefined) continue
    const cur = q[key]
    const a = next == null ? '' : String(next)
    const b = cur == null ? '' : String(cur)
    if (a !== b) (out as Record<string, unknown>)[key] = next
  }
  return out
}

function QuestionsTab() {
  const [data, setData] = useState<AdminPageResult<AdminQuestion> | null>(null)
  const [cats, setCats] = useState<AdminCategory[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [topicId, setTopicId] = useState('')
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [noExplanation, setNoExplanation] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [rowState, setRowState] = useState<Record<number, RowState>>({})
  const [savingAll, setSavingAll] = useState(false)
  const flashTimers = useRef<Record<number, number>>({})

  // поиск с задержкой, чтобы не дёргать сервер на каждую букву
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => { fetchAdminCategories().then(setCats).catch(() => setCats([])) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetchAdminQuestions({
        page, limit: pageSize, search,
        flagged: flaggedOnly, topicId: topicId ? Number(topicId) : undefined, noExplanation,
      })
      setData(r)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, flaggedOnly, topicId, noExplanation])

  useEffect(() => { load() }, [load])

  const topicOptions = useMemo(
    () => cats.flatMap((c) => c.topics.map((t) => ({
      value: String(t.id),
      label: `${c.icon} ${c.name} / ${t.name} (${t.question_count})`,
    }))),
    [cats],
  )

  const dirtyIds = useMemo(() => {
    if (!data) return []
    return data.items.map((q) => q.id).filter((id) => {
      const q = data.items.find((x) => x.id === id)
      return q ? Object.keys(changedFields(q, drafts[id] || {})).length > 0 : false
    })
  }, [data, drafts])

  const allDirtyCount = useMemo(() => Object.keys(drafts).filter((id) => {
    const q = data?.items.find((x) => x.id === Number(id))
    const draft = drafts[Number(id)] || {}
    if (!q) return Object.values(draft).some((v) => v !== undefined)
    return Object.keys(changedFields(q, draft)).length > 0
  }).length, [drafts, data])

  const setField = (id: number, patch: Draft) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }))
    setRowState((s) => ({ ...s, [id]: undefined as unknown as RowState }))
  }

  const flash = (id: number, state: RowState) => {
    setRowState((s) => ({ ...s, [id]: state }))
    window.clearTimeout(flashTimers.current[id])
    if (state !== 'saving') {
      flashTimers.current[id] = window.setTimeout(() => setRowState((s) => ({ ...s, [id]: undefined as unknown as RowState })), 1800)
    }
  }

  const applySaved = (id: number, saved: AdminQuestion) => {
    setData((d) => d ? { ...d, items: d.items.map((x) => x.id === id ? saved : x) } : d)
    setDrafts((dr) => { const n = { ...dr }; delete n[id]; return n })
  }

  const saveRow = async (id: number): Promise<boolean> => {
    const q = data?.items.find((x) => x.id === id)
    if (!q) return false
    const patch = changedFields(q, drafts[id] || {})
    if (Object.keys(patch).length === 0) return true
    flash(id, 'saving')
    try {
      const res = await updateAdminQuestion(id, patch)
      if (res.question) applySaved(id, res.question)
      flash(id, 'saved')
      return true
    } catch {
      flash(id, 'error')
      return false
    }
  }

  const saveAll = async () => {
    const ids = Object.keys(drafts).map(Number).filter((id) => {
      const q = data?.items.find((x) => x.id === id)
      return q ? Object.keys(changedFields(q, drafts[id] || {})).length > 0 : false
    })
    if (ids.length === 0) return
    setSavingAll(true)
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await saveRow(id)
    }
    setSavingAll(false)
  }

  const resetRow = (id: number) => {
    setDrafts((d) => { const n = { ...d }; delete n[id]; return n })
    setRowState((s) => ({ ...s, [id]: undefined as unknown as RowState }))
  }

  const toggleFlag = async (q: AdminQuestion) => {
    const flagged = q.flagged ? 0 : 1
    setData((d) => d ? { ...d, items: d.items.map((x) => x.id === q.id ? { ...x, flagged } : x) } : d)
    try {
      await updateAdminQuestion(q.id, { flagged })
    } catch {
      setData((d) => d ? { ...d, items: d.items.map((x) => x.id === q.id ? { ...x, flagged: q.flagged } : x) } : d)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(`Удалить вопрос #${id}?`)) return
    await deleteAdminQuestion(id)
    resetRow(id)
    load()
  }

  const resetFilters = () => {
    setSearchInput(''); setSearch(''); setTopicId(''); setFlaggedOnly(false); setNoExplanation(false); setPage(1)
  }

  const hasFilters = Boolean(searchInput || topicId || flaggedOnly || noExplanation)
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  return (
    <div>
      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <div className={styles.searchWrap}>
            <Input
              size="sm"
              fullWidth
              placeholder="Поиск: вопрос, ответ, пояснение, тема…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className={styles.topicWrap}>
            <Select
              size="sm"
              fullWidth
              value={topicId}
              onChange={(e) => { setTopicId(e.target.value); setPage(1) }}
              options={[{ value: '', label: 'Все темы' }, ...topicOptions]}
            />
          </div>
          <label className={styles.check}>
            <input type="checkbox" checked={flaggedOnly} onChange={(e) => { setFlaggedOnly(e.target.checked); setPage(1) }} />
            🚩 отмеченные
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={noExplanation} onChange={(e) => { setNoExplanation(e.target.checked); setPage(1) }} />
            без пояснения
          </label>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>Сбросить</Button>
          )}
        </div>

        <div className={styles.statsRow}>
          <span className={styles.stats}>Найдено: <b>{loading ? '…' : total}</b></span>
          {allDirtyCount > 0 && <span className={styles.dirtyNote}>изменено: {allDirtyCount}</span>}
          {allDirtyCount > 0 && (
            <Button variant="primary" size="sm" disabled={savingAll} onClick={saveAll}>
              {savingAll ? 'Сохраняю…' : `Сохранить всё (${allDirtyCount})`}
            </Button>
          )}
        </div>
      </div>

      <Paginator
        page={page} pages={pages} total={total} pageSize={pageSize}
        onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }}
      />

      {loading && !data && <div className={styles.loader}><Spinner size="md" /></div>}
      {!loading && data && data.items.length === 0 && (
        <p className={styles.empty}>Ничего не найдено — попробуй изменить фильтры.</p>
      )}

      <div className={styles.cards}>
        {data?.items.map((q) => (
          <QuestionCard
            key={q.id}
            q={q}
            draft={drafts[q.id] || {}}
            state={rowState[q.id]}
            dirty={dirtyIds.includes(q.id)}
            onField={setField}
            onSave={saveRow}
            onReset={resetRow}
            onDelete={handleDelete}
            onToggleFlag={toggleFlag}
          />
        ))}
      </div>

      {pages > 1 && (
        <Paginator
          page={page} pages={pages} total={total} pageSize={pageSize}
          onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }}
        />
      )}
    </div>
  )
}

// ---------- карточка вопроса ----------

interface QuestionCardProps {
  q: AdminQuestion
  draft: Draft
  state?: RowState
  dirty: boolean
  onField: (id: number, patch: Draft) => void
  onSave: (id: number) => void
  onReset: (id: number) => void
  onDelete: (id: number) => void
  onToggleFlag: (q: AdminQuestion) => void
}

function QuestionCard({ q, draft, state, dirty, onField, onSave, onReset, onDelete, onToggleFlag }: QuestionCardProps) {
  const value = <K extends keyof AdminQuestion>(key: K): string => {
    const v = draft[key] !== undefined ? draft[key] : q[key]
    return v == null ? '' : String(v)
  }
  const correct = draft.correct_index !== undefined ? Number(draft.correct_index) : q.correct_index

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onSave(q.id) }
    else if (e.key === 'Escape' && dirty) { e.preventDefault(); onReset(q.id) }
  }

  // ответы — однострочные по смыслу: Enter не переносит строку, а сохраняет карточку
  const onAnswerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); onSave(q.id) }
    else onKeyDown(e)
  }

  const explanationEmpty = value('explanation').trim() === ''

  return (
    <article className={cx(styles.card, dirty && styles.cardDirty)}>
      <div className={styles.cardHead}>
        <span className={styles.qid}>#{q.id}</span>
        <span className={styles.qmeta} title={`${q.category_name} / ${q.topic_name}`}>
          {q.category_name} · {q.topic_name}
        </span>
        <button
          type="button"
          className={cx(styles.flagBtn, q.flagged ? styles.flagOn : '')}
          onClick={() => onToggleFlag(q)}
          title={q.flagged ? 'Снять отметку' : 'Отметить вопрос'}
        >
          🚩
        </button>
        <span className={styles.spacer} />
        {dirty && <span className={styles.stateDirty}>изменено</span>}
        {state === 'saving' && <span className={styles.stateSaving}>сохраняю…</span>}
        {state === 'saved' && <span className={styles.stateSaved}>сохранено ✓</span>}
        {state === 'error' && <span className={styles.stateError}>не сохранилось</span>}
        <Button size="sm" variant={dirty ? 'primary' : 'ghost'} disabled={!dirty || state === 'saving'} onClick={() => onSave(q.id)}>
          Сохранить
        </Button>
        <Button size="sm" variant="ghost" disabled={!dirty} onClick={() => onReset(q.id)}>Вернуть</Button>
        <Button size="sm" variant="link" onClick={() => onDelete(q.id)}>удалить</Button>
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Вопрос</span>
        <Textarea
          autoResize
          minRows={2}
          maxRows={18}
          fullWidth
          size="sm"
          value={value('text')}
          onChange={(e) => onField(q.id, { text: e.target.value })}
          onKeyDown={onKeyDown}
        />
      </div>

      <div className={styles.answers}>
        {([0, 1, 2, 3] as const).map((i) => {
          const key = `answer_${i + 1}` as keyof AdminQuestion
          const isCorrect = correct === i
          return (
            <label key={i} className={cx(styles.answer, isCorrect && styles.answerCorrect)}>
              <input
                type="radio"
                name={`correct-${q.id}`}
                checked={isCorrect}
                onChange={() => onField(q.id, { correct_index: i })}
                title="Правильный ответ"
              />
              <Textarea
                autoResize
                minRows={1}
                maxRows={8}
                fullWidth
                size="sm"
                value={value(key)}
                onChange={(e) => onField(q.id, { [key]: e.target.value.replace(/\n+/g, ' ') } as Draft)}
                onKeyDown={onAnswerKeyDown}
              />
            </label>
          )
        })}
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>
            Пояснение {explanationEmpty && <em className={styles.warn}>— пусто</em>}
          </span>
          <Textarea
            autoResize
            minRows={2}
            maxRows={14}
            fullWidth
            size="sm"
            value={value('explanation')}
            onChange={(e) => onField(q.id, { explanation: e.target.value })}
            onKeyDown={onKeyDown}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Заметка</span>
          <Textarea
            autoResize
            minRows={2}
            maxRows={14}
            fullWidth
            size="sm"
            value={value('note')}
            onChange={(e) => onField(q.id, { note: e.target.value })}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </article>
  )
}

// ===================== Categories Tab =====================

function CategoriesTab() {
  const [cats, setCats] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newTopicName, setNewTopicName] = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setCats(await fetchAdminCategories())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    await createAdminCategory(newCatName.trim())
    setNewCatName('')
    load()
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Удалить категорию и ВСЕ вопросы в ней?')) return
    await deleteAdminCategory(id)
    load()
  }

  const handleAddTopic = async (catId: number) => {
    const name = newTopicName[catId]?.trim()
    if (!name) return
    await createAdminTopic(catId, name)
    setNewTopicName((p) => { const n = { ...p }; delete n[catId]; return n })
    load()
  }

  const handleDeleteTopic = async (id: number) => {
    if (!confirm('Удалить тему и все вопросы в ней?')) return
    await deleteAdminTopic(id)
    load()
  }

  return (
    <div>
      {loading ? <div className={styles.loader}><Spinner size="md" /></div> : (
        <div>
          {cats.map((cat) => (
            <div key={cat.id} className={styles.catCard}>
              <h3 className={styles.catName}>
                {cat.icon} {cat.name}
                <Button variant="link" size="sm" onClick={() => handleDeleteCategory(cat.id)}>удл</Button>
              </h3>
              <ul className={styles.topicList}>
                {cat.topics.map((t) => (
                  <li key={t.id} className={styles.topicItem}>
                    {t.name} <span className={styles.qCount}>({t.question_count})</span>
                    <Button variant="link" size="sm" onClick={() => handleDeleteTopic(t.id)}>удл</Button>
                  </li>
                ))}
              </ul>
              <div className={styles.addRow}>
                <Input
                  value={newTopicName[cat.id] || ''}
                  onChange={(e) => setNewTopicName((p) => ({ ...p, [cat.id]: e.target.value }))}
                  placeholder="Новая тема"
                  size="sm"
                />
                <Button variant="secondary" size="sm" onClick={() => handleAddTopic(cat.id)}>+</Button>
              </div>
            </div>
          ))}
          <div className={styles.addRow}>
            <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Новая категория" size="sm" />
            <Button variant="secondary" size="sm" onClick={handleAddCategory}>+</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===================== Users Tab =====================

function UsersTab() {
  const [data, setData] = useState<AdminPageResult<AdminUser> | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setData(await fetchAdminUsers(page, search, pageSize))
    setLoading(false)
  }, [page, search, pageSize])

  useEffect(() => { load() }, [load])

  const toggleAdmin = async (user: AdminUser) => {
    await updateAdminUser(user.id, { is_admin: user.is_admin ? 0 : 1 })
    load()
  }

  const columns: TableColumn<AdminUser>[] = [
    { key: 'id', label: 'ID', width: '50px' },
    { key: 'login', label: 'Логин' },
    { key: 'nickname', label: 'Ник' },
    { key: 'email', label: 'Email' },
    { key: 'level', label: 'Уровень', width: '60px' },
    {
      key: 'admin', label: 'Админ', width: '70px',
      render: (u) => <span style={{ color: u.is_admin ? 'var(--color-success)' : 'var(--color-neutral)' }}>{u.is_admin ? 'да' : 'нет'}</span>,
    },
    {
      key: 'actions', label: '', width: '100px',
      render: (u) => (
        <Button variant="link" size="sm" onClick={() => toggleAdmin(u)}>
          {u.is_admin ? 'разжаловать' : 'сделать админом'}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <SearchForm value={search} onChange={(v) => { setSearch(v); setPage(1) }} />
      <Table columns={columns} data={data?.items || []} rowKey={(u) => u.id} loading={loading} />
      <Paginator
        page={page} pages={data?.pages ?? 1} total={data?.total} pageSize={pageSize}
        onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }}
      />
    </div>
  )
}
