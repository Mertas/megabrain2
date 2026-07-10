import { useState, useEffect, useCallback } from 'react'
import { SearchForm } from '../../molecules/SearchForm/SearchForm'
import { Button } from '../../atoms/Button/Button'
import { Table, type TableColumn } from '../../molecules/Table/Table'
import { fetchUsers, type UserListItem, type AdminPageResult } from '../../../lib/api'
import { getEloIcon } from '../../../lib/icons'
import styles from './UsersPage.module.scss'

export interface UsersPageProps {
  onNavigate?: (step: string) => void
}

export function UsersPage({ onNavigate }: UsersPageProps) {
  const [data, setData] = useState<AdminPageResult<UserListItem> | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await fetchUsers(page, search))
    } catch { setData(null) }
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  const columns: TableColumn<UserListItem>[] = [
    { key: 'icon', label: '', width: '30px', render: (u) => <span className={styles.icon}>{getEloIcon(u.elo)}</span> },
    { key: 'login', label: 'Логин', render: (u) => (
      <a href={`/users/${u.login}`} onClick={(e) => { e.preventDefault(); onNavigate?.(`profile:${u.login}`) }}>
        {u.nickname || u.login}
      </a>
    )},
    { key: 'elo', label: 'ELO', width: '50px' },
    { key: 'level', label: 'Уровень', width: '60px' },
    { key: 'authoredCount', label: 'Вопросов', width: '70px', render: (u) => <span>{u.authoredCount}</span> },
  ]

  return (
    <div>
      <h1 className={styles.title}>Люди</h1>
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
