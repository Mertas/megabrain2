import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { InlineEdit } from '../../molecules/InlineEdit/InlineEdit'
import type { ProfileStats } from '../../../lib/api'
import styles from './UserProfile.module.scss'

export interface UserProfileProps {
  user: {
    level: number
    icon: string
    nickname: string
    name: string
    login?: string
    location: string
    firstSeen: string
    topics: { name: string; subtopics: string[] }[]
    stats: ProfileStats
  }
  isOwner?: boolean
  onSave?: (fields: { nickname?: string; name?: string }) => void
}

type Tab = 'info' | 'stats' | 'questions'

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

const FORMAT_META: Record<string, { icon: string; color: string }> = {
  solo:     { icon: '🧩', color: '#37CE74' },
  pvp:      { icon: '⚔️', color: '#F9A253' },
  blitz:    { icon: '⚡', color: '#FF6633' },
  survival: { icon: '🔥', color: '#C9A' },
}

// ─── Stat Row ────────────────────────────────────────────────────────────

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${highlight ? styles.statHighlight : ''}`}>{value}</span>
    </div>
  )
}

// ─── Info Tab ────────────────────────────────────────────────────────────

function InfoTab({ user, isOwner, onSave }: UserProfileProps) {
  return (
    <div className={styles.infoCard}>
      <h4 className={styles.infoCardTitle}>О себе</h4>
      <dl className={styles.infoDl}>
        <dt>Имя</dt>
        <dd>{isOwner ? <InlineEdit value={user.name} onSave={(v) => onSave?.({ name: v })} label="Имя" /> : (user.name || '—')}</dd>
        <dt>Ник</dt>
        <dd>{isOwner ? <InlineEdit value={user.nickname} onSave={(v) => onSave?.({ nickname: v })} label="Ник" /> : user.nickname}</dd>
        <dt>Логин</dt>
        <dd>{user.login || '—'}</dd>
        <dt>Уровень</dt>
        <dd>{user.level}</dd>
        <dt>На сайте с</dt>
        <dd>{user.firstSeen.replace(/^c /, '')}</dd>
        {user.location && <><dt>Город</dt><dd>{user.location}</dd></>}
      </dl>
    </div>
  )
}

// ─── Stats Tab ───────────────────────────────────────────────────────────

function StatsTab({ stats }: { stats: ProfileStats }) {
  const maxFormat = Math.max(...stats.gamesByFormat.map((f) => f.count), 1)

  return (
    <div className={styles.statsContent}>
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{formatCount(stats.totalGames)}</span>
          <span className={styles.summaryLabel}>всего игр</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{formatCount(stats.totalQuestions)}</span>
          <span className={styles.summaryLabel}>вопросов</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{stats.overallAccuracy}%</span>
          <span className={styles.summaryLabel}>точность</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{formatCount(stats.questionsAuthored)}</span>
          <span className={styles.summaryLabel}>вопросов<br />создано</span>
        </div>
      </div>

      <h4 className={styles.sectionSubtitle}>По форматам</h4>
      <div className={styles.formatBars}>
        {stats.gamesByFormat.map((f) => {
          const meta = FORMAT_META[f.format] || { icon: '?', color: '#999' }
          const pct = Math.round((f.count / maxFormat) * 100)
          return (
            <div key={f.format} className={styles.formatBarRow}>
              <span className={styles.formatIcon}>{meta.icon}</span>
              <span className={styles.formatLabel}>{f.label}</span>
              <span className={styles.formatCount}>{formatCount(f.count)}</span>
              <div className={styles.formatBarTrack}>
                <div className={styles.formatBarFill} style={{ width: `${pct}%`, backgroundColor: meta.color }} />
              </div>
            </div>
          )
        })}
      </div>

      <h4 className={styles.sectionSubtitle}>Детали по режимам</h4>
      <div className={styles.formatCards}>
        <div className={styles.formatCard}>
          <div className={styles.formatCardHeader}>
            <span>{FORMAT_META.solo.icon} Соло</span>
            <span>{formatCount(stats.solo.gamesPlayed)} игр</span>
          </div>
          <div className={styles.formatCardBody}>
            <StatRow label="Вопросов" value={String(stats.solo.totalQuestions)} />
            <StatRow label="Верно" value={`${stats.solo.totalCorrect} (${stats.solo.accuracy}%)`} />
            <StatRow label="Средний счёт" value={String(stats.solo.avgScore)} />
            <StatRow label="Всего очков" value={String(stats.solo.totalScore)} />
          </div>
        </div>

        <div className={styles.formatCard}>
          <div className={styles.formatCardHeader}>
            <span>{FORMAT_META.pvp.icon} PvP</span>
            <span>{formatCount(stats.pvp.gamesPlayed)} игр</span>
          </div>
          <div className={styles.formatCardBody}>
            <StatRow label="Рейтинг" value={String(stats.pvp.rating)} highlight />
            <StatRow label="Побед" value={String(stats.pvp.wins)} />
            <StatRow label="Поражений" value={String(stats.pvp.losses)} />
            <StatRow label="Ничьих" value={String(stats.pvp.draws)} />
            <StatRow label="Win rate" value={stats.pvp.gamesPlayed > 0 ? `${Math.round((stats.pvp.wins / stats.pvp.gamesPlayed) * 100)}%` : '—'} />
          </div>
        </div>

        <div className={styles.formatCard}>
          <div className={styles.formatCardHeader}>
            <span>{FORMAT_META.blitz.icon} Блиц</span>
            <span>{formatCount(stats.blitz.gamesPlayed)} игр</span>
          </div>
          <div className={styles.formatCardBody}>
            <StatRow label="Рейтинг" value={String(stats.blitz.rating)} highlight />
            <StatRow label="Побед" value={String(stats.blitz.wins)} />
            <StatRow label="Поражений" value={String(stats.blitz.losses)} />
            <StatRow label="Ничьих" value={String(stats.blitz.draws)} />
            <StatRow label="Win rate" value={stats.blitz.gamesPlayed > 0 ? `${Math.round((stats.blitz.wins / stats.blitz.gamesPlayed) * 100)}%` : '—'} />
          </div>
        </div>

        <div className={styles.formatCard}>
          <div className={styles.formatCardHeader}>
            <span>{FORMAT_META.survival.icon} Выживание</span>
            <span>{formatCount(stats.survival.gamesPlayed)} игр</span>
          </div>
          <div className={styles.formatCardBody}>
            <StatRow label="Вопросов" value={String(stats.survival.totalQuestions)} />
            <StatRow label="Верно" value={`${stats.survival.totalCorrect} (${stats.survival.accuracy}%)`} />
            <StatRow label="Лучший счёт" value={String(stats.survival.bestScore)} highlight />
            <StatRow label="Лучший стрик" value={String(stats.survival.bestStreak)} highlight />
            <StatRow label="Средний счёт" value={String(stats.survival.avgScore)} />
          </div>
        </div>
      </div>

      {stats.recent.length > 0 && (
        <>
          <h4 className={styles.sectionSubtitle}>Последние игры</h4>
          <div className={styles.recentList}>
            {stats.recent.map((g) => {
              const meta = FORMAT_META[g.format] || { icon: '?', color: '#999' }
              const won = g.format === 'pvp' || g.format === 'blitz' ? g.correct === 1 : undefined
              return (
                <div key={`${g.format}-${g.id}`} className={styles.recentRow}>
                  <span className={styles.recentIcon}>{meta.icon}</span>
                  <span className={styles.recentFormat}>{g.format}</span>
                  {g.format === 'solo' || g.format === 'survival' ? (
                    <span className={styles.recentScore}>{g.correct}/{g.total} — {g.score} pts</span>
                  ) : (
                    <span className={`${styles.recentScore} ${won ? styles.recentWin : styles.recentLoss}`}>
                      {won ? 'Win' : 'Loss'} — {g.score} pts
                    </span>
                  )}
                  <span className={styles.recentDate}>{new Date(g.date).toLocaleDateString('ru-RU')}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Questions Tab ───────────────────────────────────────────────────────

function QuestionsTab({ stats }: { stats: ProfileStats }) {
  const maxCat = Math.max(...stats.authoredByCategory.map((c) => c.total), 1)

  return (
    <div className={styles.questionsContent}>
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{formatCount(stats.questionsAuthored)}</span>
          <span className={styles.summaryLabel}>всего<br />создано</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{stats.authoredByCategory.length}</span>
          <span className={styles.summaryLabel}>категорий<br />охвачено</span>
        </div>
        {stats.authoredByCategory.length > 0 && (
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue}>{stats.authoredByCategory[0].category}</span>
            <span className={styles.summaryLabel}>топ-категория<br />({stats.authoredByCategory[0].total} вопр.)</span>
          </div>
        )}
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>
            {stats.authoredByCategory.reduce((sum, c) => sum + c.topics.length, 0)}
          </span>
          <span className={styles.summaryLabel}>тем<br />охвачено</span>
        </div>
      </div>

      <h4 className={styles.sectionSubtitle}>Распределение по категориям и темам</h4>
      <div className={styles.authoredTree}>
        {stats.authoredByCategory.map((cat) => (
          <div key={cat.category} className={styles.authoredCatBlock}>
            <div className={styles.authoredCatHeader}>
              <span className={styles.authoredCatName}>{cat.category}</span>
              <span className={styles.authoredCatCount}>{cat.total}</span>
              <div className={styles.authoredCatBarTrack}>
                <div
                  className={styles.authoredCatBarFill}
                  style={{ width: `${Math.round((cat.total / maxCat) * 100)}%` }}
                />
              </div>
            </div>
            <div className={styles.authoredTopics}>
              {cat.topics.map((t) => (
                <div key={t.topic} className={styles.authoredTopicRow}>
                  <span className={styles.authoredTopicName}>{t.topic}</span>
                  <span className={styles.authoredTopicCount}>{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

export function UserProfile(props: UserProfileProps) {
  const { user, isOwner = false } = props
  const [tab, setTab] = useState<Tab>('info')

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <span className={styles.iconStatic}>{user.icon}</span>
        <div className={styles.headerInfo}>
          <div className={styles.headerTop}>
            <span className={styles.level}>{user.level}</span>
            <span className={styles.nickname}>{user.nickname}</span>
          </div>
          <div className={styles.headerMeta}>
            {user.name && <span className={styles.headerName}>{user.name}</span>}
            {user.firstSeen && <span className={styles.headerDate}>c {user.firstSeen.replace(/^c /, '')}</span>}
          </div>
        </div>
        {isOwner && (
          <Link to="/change-password" className={styles.changePwdLink}>сменить пароль</Link>
        )}
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'info' ? styles.tabActive : ''}`} onClick={() => setTab('info')}>Инфо</button>
        <button className={`${styles.tab} ${tab === 'stats' ? styles.tabActive : ''}`} onClick={() => setTab('stats')}>Статистика</button>
        <button className={`${styles.tab} ${tab === 'questions' ? styles.tabActive : ''}`} onClick={() => setTab('questions')}>Вопросы</button>
      </div>

      <div className={styles.tabContent}>
        {tab === 'info' && <InfoTab {...props} />}
        {tab === 'stats' && <StatsTab stats={user.stats} />}
        {tab === 'questions' && <QuestionsTab stats={user.stats} />}
      </div>
    </div>
  )
}
