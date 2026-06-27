import styles from './Tabs.module.scss'

export interface TabItem {
  key: string
  label: string
  icon?: string
  title?: string
}

export interface TabsProps {
  items: TabItem[]
  activeKey: string
  onChange: (key: string) => void
  children: React.ReactNode
}

export function Tabs({ items, activeKey, onChange, children }: TabsProps) {
  return (
    <div>
      <div className={styles.labels} role="tablist">
        {items.map((item) => {
          const isActive = item.key === activeKey
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`tab-${item.key}`}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
              aria-selected={isActive}
              title={item.title}
              onClick={() => onChange(item.key)}
            >
              {item.icon && <span aria-hidden="true">{item.icon} </span>}
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`panel-${activeKey}`}
        aria-labelledby={`tab-${activeKey}`}
        className={styles.content}
      >
        {children}
      </div>
    </div>
  )
}
