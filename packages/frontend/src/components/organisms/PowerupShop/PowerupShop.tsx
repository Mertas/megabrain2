import { useState, useEffect, useCallback } from 'react'
import { Button } from '../../atoms/Button/Button'
import { Tooltip } from '../../atoms/Tooltip/Tooltip'
import {
  fetchPowerupTypes, fetchPowerupInventory, buyPowerup,
  type PowerupType, type UserPowerup,
} from '../../../lib/api'
import styles from './PowerupShop.module.scss'

function modeName(availableIn: string): string {
  const map: Record<string, string> = {
    all: 'Все режимы',
    'solo,survival': 'Соло, Выживание',
    'solo,pvp': 'Соло, PvP',
    'pvp,blitz': 'PvP, Блиц',
    solo: 'Соло',
    survival: 'Выживание',
  }
  return map[availableIn] || availableIn
}

export function PowerupShop() {
  const [types, setTypes] = useState<PowerupType[]>([])
  const [inventory, setInventory] = useState<UserPowerup[]>([])
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [infoOpen, setInfoOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [t, inv] = await Promise.all([fetchPowerupTypes(), fetchPowerupInventory()])
      setTypes(t)
      setInventory(inv.inventory)
      setScore(inv.score)
    } catch { setMessage('Ошибка загрузки') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleBuy = async (id: string) => {
    setMessage('')
    try {
      const r = await buyPowerup(id, 1)
      if (r.ok) {
        await loadData()
        setMessage('Куплено!')
        setTimeout(() => setMessage(''), 2000)
      }
    } catch (e: any) {
      setMessage(e?.message || 'Не удалось купить')
    }
  }

  const getQty = (id: string) => {
    const item = inventory.find((i) => i.powerupId === id)
    return item?.quantity || 0
  }

  const categories: Record<string, string> = {
    utility: 'Универсальные',
    defensive: 'Защитные',
    offensive: 'Атакующие',
    global: 'Глобальные',
  }

  const grouped = types.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {} as Record<string, PowerupType[]>)

  if (loading) return <div className={styles.loading}>Загрузка...</div>

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Power-ups</h1>
        <div className={styles.balance}>
          Доступно очков: <strong>{score}</strong>
        </div>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.infoToggle}>
        <Button variant="ghost" size="sm" onClick={() => setInfoOpen((v) => !v)}>
          {infoOpen ? 'Скрыть' : 'Как работают power-ups?'}
        </Button>
      </div>

      {infoOpen && (
        <div className={styles.infoBlock}>
          <h3>Что такое power-ups?</h3>
          <p>
            Power-ups — это одноразовые усиления, которые можно использовать во время игры.
            Они дают тактическое преимущество: убирают неверные ответы, добавляют время,
            защищают от ошибок или атакуют соперника.
          </p>

          <h3>Как получить?</h3>
          <ul>
            <li><strong>Покупка</strong> — в магазине за накопленные игровые очки</li>
            <li><strong>Бонусы</strong> — ежедневный вход, level-up, серия побед в PvP</li>
          </ul>

          <h3>Как использовать в игре?</h3>
          <p>
            Перед началом PvP-матча или Блиц-дуэли выберите до <strong>3 power-ups</strong> в панели лобби.
            Во время игры нажимайте клавиши <kbd>Z</kbd> <kbd>X</kbd> <kbd>C</kbd> или кликайте по иконкам
            на нижней панели. Каждый power-up можно использовать <strong>только один раз за матч</strong>.
          </p>
          <p>
            В соло-режиме и Выживании power-ups выбираются автоматически из вашего инвентаря
            (до 3 шт, приоритет: защитные → универсальные). Используются теми же клавишами.
          </p>

          <h3>Ограничения</h3>
          <ul>
            <li>Не более <strong>3 power-ups</strong> на одну игру (4 с «Доп. слотом»)</li>
            <li>Не более <strong>20 штук</strong> каждого типа в инвентаре</li>
            <li>Нельзя использовать два power-up'а на одном вопросе</li>
          </ul>

          <h3>Категории</h3>
          <ul>
            <li><strong>Универсальные</strong> — работают во всех режимах (50:50, ×2 очка, доп. время...)</li>
            <li><strong>Защитные</strong> — защищают вас от ошибок или атак соперника (Щит, Отражение...)</li>
            <li><strong>Атакующие</strong> — воздействуют на соперника в PvP/Blitz (Заморозка...)</li>
            <li><strong>Глобальные</strong> — активируются до начала игры и действуют весь матч (Буст очков, Фора...)</li>
          </ul>
        </div>
      )}

      <div className={styles.invBar}>
        <h3>Ваш инвентарь</h3>
        <div className={styles.invGrid}>
          {inventory.filter((i) => i.quantity > 0).map((i) => {
            const t = types.find((x) => x.id === i.powerupId)
            return (
              <Tooltip key={i.powerupId} text={t?.description || ''} position="top">
                <div className={styles.invItem}>
                  <span className={styles.invIcon}>{t?.icon || '?'}</span>
                  <span>×{i.quantity}</span>
                </div>
              </Tooltip>
            )
          })}
          {inventory.filter((i) => i.quantity > 0).length === 0 && (
            <div className={styles.emptyInv}>Пока пусто. Купите ниже!</div>
          )}
        </div>
      </div>

      {Object.entries(categories).map(([cat, label]) => {
        const items = grouped[cat]
        if (!items) return null
        return (
          <div key={cat} className={styles.category}>
            <h2 className={styles.catTitle}>{label}</h2>
            <div className={styles.grid}>
              {items.map((t) => {
                const qty = getQty(t.id)
                const canBuy = score >= t.cost && qty < 20
                return (
                  <div key={t.id} className={styles.card}>
                    <div className={styles.cardIcon}>{t.icon}</div>
                    <div className={styles.cardName}>{t.name}</div>
                    <div className={styles.cardDesc}>
                      <Tooltip text={t.description} position="right">
                        <span className={styles.cardDescText}>{t.description}</span>
                      </Tooltip>
                    </div>
                    <div className={styles.cardModes}>{modeName(t.available_in)}</div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardCost}>{t.cost} очков</span>
                      <span className={styles.cardQty}>Имеется: {qty}</span>
                    </div>
                    <Button variant="primary" size="sm" disabled={!canBuy} onClick={() => handleBuy(t.id)}>
                      Купить
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
