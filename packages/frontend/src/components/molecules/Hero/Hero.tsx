import { Text } from '../../atoms/Text/Text'
import styles from './Hero.module.scss'

interface HeroProps {
  icon?: string
  title: string
  description?: string
}

export function Hero({ icon, title, description }: HeroProps) {
  return (
    <div className={styles.hero}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <Text as="h1" variant="heading" data-testid="hero-title">{title}</Text>
      {description && <p className={styles.desc}>{description}</p>}
    </div>
  )
}
