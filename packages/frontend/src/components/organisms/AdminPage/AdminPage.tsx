import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Table, type TableColumn } from '../../molecules/Table/Table'
import { Tabs } from '../../molecules/Tabs/Tabs'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
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

type Tab = 'questions' | 'categories' | 'users'

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('questions')

  return (
    <div>
      <h1 className={styles.title}>Админка</h1>
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

function QuestionsTab() {
  const [data, setData] = useState<AdminPageResult<AdminQuestion> | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<AdminQuestion>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetchAdminQuestions(page, search)
    setData(r)
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  const handleEdit = (q: AdminQuestion) => {
    setEditingId(q.id)
    setEditForm({ text: q.text, answer_1: q.answer_1, answer_2: q.answer_2, answer_3: q.answer_3, answer_4: q.answer_4, correct_index: q.correct_index, explanation: q.explanation || '', note: q.note || '' })
  }

  const handleSave = async () => {
    if (editingId == null) return
    await updateAdminQuestion(editingId, editForm)
    setEditingId(null)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить вопрос?')) return
    await deleteAdminQuestion(id)
    load()
  }

  const columns: TableColumn<AdminQuestion>[] = [
    { key: 'id', label: 'ID', width: '50px' },
    { key: 'text', label: 'Текст', render: (q) => <div className={styles.textCell}>{q.text}</div> },
    { key: 'topic_name', label: 'Тема' },
    { key: 'category_name', label: 'Категория' },
    {
      key: 'actions', label: '', width: '100px',
      render: (q) => (
        <span className={styles.actions}>
          <Button variant="link" size="sm" onClick={() => handleEdit(q)}>ред</Button>
          <Button variant="link" size="sm" onClick={() => handleDelete(q.id)}>удл</Button>
        </span>
      ),
    },
  ]

  return (
    <div>
      <SearchForm value={search} onChange={(v) => { setSearch(v); setPage(1) }} />
      <Table columns={columns} data={data?.items || []} rowKey={(q) => q.id} loading={loading} />
      {data && data.pages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: data.pages }, (_, i) => (
            <Button key={i} variant={page === i + 1 ? 'primary' : 'ghost'} size="sm" onClick={() => setPage(i + 1)}>
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      {editingId != null && createPortal(
        <div className={styles.editOverlay}>
          <div className={styles.editPanel}>
            <h3>Редактировать вопрос #{editingId}</h3>
            <EditField label="Текст" value={editForm.text || ''} onChange={(v) => setEditForm((f) => ({ ...f, text: v }))} textarea />
            <EditField label="Ответ 1" value={editForm.answer_1 || ''} onChange={(v) => setEditForm((f) => ({ ...f, answer_1: v }))} />
            <EditField label="Ответ 2" value={editForm.answer_2 || ''} onChange={(v) => setEditForm((f) => ({ ...f, answer_2: v }))} />
            <EditField label="Ответ 3" value={editForm.answer_3 || ''} onChange={(v) => setEditForm((f) => ({ ...f, answer_3: v }))} />
            <EditField label="Ответ 4" value={editForm.answer_4 || ''} onChange={(v) => setEditForm((f) => ({ ...f, answer_4: v }))} />
            <EditField label="Верный индекс (0-3)" value={String(editForm.correct_index ?? 0)} onChange={(v) => setEditForm((f) => ({ ...f, correct_index: parseInt(v) || 0 }))} />
            <EditField label="Пояснение" value={editForm.explanation || ''} onChange={(v) => setEditForm((f) => ({ ...f, explanation: v }))} textarea />
            <EditField label="Комментарий" value={editForm.note || ''} onChange={(v) => setEditForm((f) => ({ ...f, note: v }))} textarea />
            <div className={styles.editActions}>
              <Button variant="primary" size="sm" onClick={handleSave}>Сохранить</Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Отмена</Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

function EditField({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <label className={styles.editField}>
      <span className={styles.editLabel}>{label}</span>
      {textarea ? (
        <textarea className={styles.editTextarea} value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} fullWidth />
      )}
    </label>
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
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setData(await fetchAdminUsers(page, search))
    setLoading(false)
  }, [page, search])

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
      render: (u) => <span style={{ color: u.is_admin ? '#37CE74' : '#999' }}>{u.is_admin ? 'да' : 'нет'}</span>,
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
      {data && data.pages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: data.pages }, (_, i) => (
            <Button key={i} variant={page === i + 1 ? 'primary' : 'ghost'} size="sm" onClick={() => setPage(i + 1)}>
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
