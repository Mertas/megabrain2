import styles from './Breadcrumbs.module.scss'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={item.label}>
            {i > 0 && <span className={styles.sep} aria-hidden="true">: </span>}
            {isLast ? (
              <span className={styles.current} aria-current="page">{item.label}</span>
            ) : item.href ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
