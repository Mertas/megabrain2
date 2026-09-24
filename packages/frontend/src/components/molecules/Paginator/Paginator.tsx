import { Button } from '../../atoms/Button/Button'
import { Select } from '../../atoms/Select/Select'
import styles from './Paginator.module.scss'

export interface PaginatorProps {
  page: number
  pages: number
  total?: number
  pageSize?: number
  pageSizes?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  /** Компактный режим — без подписи диапазона (для узких мест) */
  compact?: boolean
}

/** Окно страниц с многоточиями: 1 … 4 [5] 6 … 24 */
export function buildPageWindow(page: number, pages: number, span = 1): (number | '…')[] {
  const nums = new Set<number>([1, pages])
  for (let i = page - span; i <= page + span; i += 1) {
    if (i >= 1 && i <= pages) nums.add(i)
  }
  const sorted = [...nums].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  let prev = 0
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push('…')
    out.push(n)
    prev = n
  }
  return out
}

export function Paginator({
  page, pages, total, pageSize, pageSizes = [10, 20, 50, 100],
  onPageChange, onPageSizeChange, compact = false,
}: PaginatorProps) {
  const safePages = Math.max(1, pages)
  const window = buildPageWindow(page, safePages)

  const from = total != null && pageSize ? (page - 1) * pageSize + 1 : null
  const to = total != null && pageSize ? Math.min(total, page * pageSize) : null

  return (
    <div className={styles.paginator}>
      {!compact && (
        <span className={styles.range}>
          {total != null && from != null && to != null
            ? `${from}–${to} из ${total}`
            : `стр. ${page} из ${safePages}`}
        </span>
      )}

      <div className={styles.controls}>
        <Button
          variant="ghost" size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Предыдущая страница"
        >
          ‹
        </Button>

        {window.map((item, i) => item === '…' ? (
          <span key={`gap-${i}`} className={styles.gap}>…</span>
        ) : (
          <Button
            key={item}
            variant={item === page ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => item !== page && onPageChange(item)}
          >
            {item}
          </Button>
        ))}

        <Button
          variant="ghost" size="sm"
          disabled={page >= safePages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Следующая страница"
        >
          ›
        </Button>
      </div>

      {!compact && (
        <label className={styles.size}>
          <span>по</span>
          <Select
            size="sm"
            value={String(pageSize ?? pageSizes[1])}
            disabled={!onPageSizeChange}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            options={pageSizes.map((s) => ({ value: String(s), label: String(s) }))}
          />
        </label>
      )}
    </div>
  )
}
