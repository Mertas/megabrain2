import { Text } from '../../atoms/Text/Text'
import styles from './Hero.module.scss'

interface HeroProps {
  icon?: string
  title?: string
  description?: string
  /** Предустановка шапки по режиму игры (например, mode="blitz" или mode="pvp") */
  mode?: string
}

const MODE_PRESETS: Record<string, { icon: string; title: string; description: string }> = {
  pvp: {
    icon: '\u2694\uFE0F',
    title: 'PvP',
    description: 'Сразитесь с живым соперником. Одинаковые вопросы, одновременные ответы — побеждает самый эрудированный.',
  },
  blitz: {
    icon: '\u26A1',
    title: 'Блиц-дуэль',
    description: 'Один вопрос на двоих. Кто первый ответит правильно — забирает раунд. Скорость решает!',
  },
}

export function Hero({ icon, title, description, mode }: HeroProps) {
  const preset = mode ? MODE_PRESETS[mode] : undefined
  const finalIcon = icon ?? preset?.icon
  const finalTitle = title ?? preset?.title ?? ''
  const finalDescription = description ?? preset?.description

  return (
    <div className={styles.hero}>
      {finalIcon && <div className={styles.icon}>{finalIcon}</div>}
      <Text as="h1" variant="heading" data-testid="hero-title">{finalTitle}</Text>
      {finalDescription && <p className={styles.desc}>{finalDescription}</p>}
    </div>
  )
}
