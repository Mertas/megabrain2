import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Tooltip.module.scss'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipState {
  text: string
  position: TooltipPosition
  coords: { top: number; left: number }
  visible: boolean
}

const TOOLTIP_GAP = 4

function calcCoords(wrapperEl: HTMLElement, tooltipEl: HTMLElement, position: TooltipPosition) {
  const wr = wrapperEl.getBoundingClientRect()
  const tr = tooltipEl.getBoundingClientRect()
  let top = 0
  let left = 0

  if (position === 'top') {
    top = wr.top - tr.height - TOOLTIP_GAP
    left = wr.left + wr.width / 2 - tr.width / 2
    if (left < TOOLTIP_GAP) left = TOOLTIP_GAP
    if (left + tr.width > window.innerWidth - TOOLTIP_GAP) left = window.innerWidth - tr.width - TOOLTIP_GAP
  } else if (position === 'bottom') {
    top = wr.bottom + TOOLTIP_GAP
    left = wr.left + wr.width / 2 - tr.width / 2
    if (left < TOOLTIP_GAP) left = TOOLTIP_GAP
    if (left + tr.width > window.innerWidth - TOOLTIP_GAP) left = window.innerWidth - tr.width - TOOLTIP_GAP
  } else if (position === 'left') {
    top = wr.top + wr.height / 2 - tr.height / 2
    left = wr.left - tr.width - TOOLTIP_GAP
    if (top < TOOLTIP_GAP) top = TOOLTIP_GAP
    if (top + tr.height > window.innerHeight - TOOLTIP_GAP) top = window.innerHeight - tr.height - TOOLTIP_GAP
  } else {
    top = wr.top + wr.height / 2 - tr.height / 2
    left = wr.right + TOOLTIP_GAP
    if (top < TOOLTIP_GAP) top = TOOLTIP_GAP
    if (top + tr.height > window.innerHeight - TOOLTIP_GAP) top = window.innerHeight - tr.height - TOOLTIP_GAP
  }

  return { top, left }
}

// ---------- Portal ----------

function TooltipPortal({ state, onUpdate }: { state: TooltipState | null; onUpdate: () => void }) {
  useEffect(() => {
    if (!state) return
    const onScroll = () => onUpdate()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onUpdate)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onUpdate)
    }
  }, [state, onUpdate])

  if (!state) return null

  return createPortal(
    <span className={`${styles.tooltip} ${state.visible ? styles.visible : ''}`} style={{ top: state.coords.top, left: state.coords.left }}>
      {state.text}
    </span>,
    document.body,
  )
}

// ---------- Singleton refs (always fresh) ----------

interface TooltipApi {
  show: (text: string, position: TooltipPosition, wrapper: HTMLElement) => void
  hide: () => void
  state: TooltipState | null
}

const apiRef: { current: TooltipApi | null } = { current: null }

// ---------- Provider ----------

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TooltipState | null>(null)
  const wrapperRef = useRef<HTMLElement | null>(null)
  const hideTimerRef = useRef<number>(0)

  const updateCoords = useCallback(() => {
    setState((prev) => {
      if (!prev || !wrapperRef.current) return prev
      const dummy = document.createElement('span')
      dummy.className = styles.tooltip
      dummy.style.cssText = 'position:fixed;visibility:hidden;top:0;left:0'
      dummy.textContent = prev.text
      document.body.appendChild(dummy)
      const coords = calcCoords(wrapperRef.current, dummy, prev.position)
      document.body.removeChild(dummy)
      return { ...prev, coords }
    })
  }, [])

  const show = useCallback((text: string, position: TooltipPosition, wrapper: HTMLElement) => {
    clearTimeout(hideTimerRef.current)
    wrapperRef.current = wrapper

    const dummy = document.createElement('span')
    dummy.className = styles.tooltip
    dummy.style.cssText = 'position:fixed;visibility:hidden;top:0;left:0'
    dummy.textContent = text
    document.body.appendChild(dummy)
    const coords = calcCoords(wrapper, dummy, position)
    document.body.removeChild(dummy)

    setState({ text, position, coords, visible: true })
  }, [])

  const hide = useCallback(() => {
    hideTimerRef.current = setTimeout(() => {
      setState(null)
      wrapperRef.current = null
    }, 400)
  }, [])

  // keep ref always fresh
  apiRef.current = { show, hide, state }

  return (
    <>
      {children}
      <TooltipPortal state={state} onUpdate={updateCoords} />
    </>
  )
}

// ---------- Tooltip trigger ----------

export interface TooltipProps {
  text: string
  position?: TooltipPosition
  trigger?: 'hover' | 'click'
  delay?: number
  fullWidth?: boolean
  children: ReactNode
}

export function Tooltip({ text, position = 'top', trigger = 'hover', delay = 300, fullWidth = false, children }: TooltipProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<number>(0)

  if (!apiRef.current) throw new Error('Tooltip must be used inside <TooltipProvider>')

  const show = useCallback(() => {
    clearTimeout(timerRef.current)
    const api = apiRef.current!
    if (api.state?.visible) {
      if (wrapperRef.current) api.show(text, position, wrapperRef.current)
    } else {
      timerRef.current = setTimeout(() => {
        if (wrapperRef.current) api.show(text, position, wrapperRef.current)
      }, trigger === 'click' ? 0 : delay)
    }
  }, [text, position, trigger, delay])

  const hide = useCallback(() => {
    clearTimeout(timerRef.current)
    apiRef.current?.hide()
  }, [])

  const toggle = useCallback(() => {
    const api = apiRef.current!
    if (api.state && api.state.text === text && api.state.visible) {
      hide()
    } else {
      show()
    }
  }, [text, show, hide])

  return (
    <span
      ref={wrapperRef}
      className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`}
      onMouseEnter={trigger === 'hover' ? show : undefined}
      onMouseLeave={trigger === 'hover' ? hide : undefined}
      onClick={trigger === 'click' ? toggle : undefined}
    >
      {children}
    </span>
  )
}
