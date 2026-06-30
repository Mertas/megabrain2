import { useEffect, useRef } from 'react'
import { Link, createRoute } from '@tanstack/react-router'
import { rootRoute, PageWrap } from './base'

const LAYERS = [
  { image: '/i/a-1.png', offset: -5, top: -10, left: -10, right: -10, bottom: -10 },
  { image: '/i/a-2.png', offset: 2, top: 0, left: 0, right: 0, bottom: 0 },
  { image: '/i/a-3.png', offset: 7, top: 20, left: -20, right: -20, bottom: -40 },
  { image: '/i/a-4.png', offset: 15, top: 20, left: -20, right: -20, bottom: -40 },
]

function ParallaxPoster() {
  const posterRef = useRef<HTMLDivElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const poster = posterRef.current
    if (!poster) return

    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth
      const h = window.innerHeight
      const ox = 0.5 - e.pageX / w
      const oy = 0.5 - e.pageY / h
      const dy = e.pageY - h / 2
      const dx = e.pageX - w / 2
      const theta = Math.atan2(dy, dx) * 180 / Math.PI - 90
      const angle = theta < 0 ? theta + 360 : theta

      poster.style.transform = `translateY(${-ox * 5}px) rotateX(${-oy * 5}deg) rotateY(${ox * 10}deg)`

      if (shineRef.current) {
        shineRef.current.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,${(e.pageY / h) * 0.5}) 0%, rgba(255,255,255,0) 80%)`
      }

      layerRefs.current.forEach((el) => {
        if (!el) return
        const off = parseFloat(el.dataset.offset || '0') * 5
        el.style.transform = `translateX(${ox * off}px) translateY(${oy * off}px)`
      })
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="poster-wrapper">
      <div ref={posterRef} className="poster">
        <div ref={shineRef} className="shine" />
        {LAYERS.map((l, i) => (
          <div
            key={i}
            ref={(el) => { layerRefs.current[i] = el }}
            data-offset={l.offset}
            className="layer"
            style={{ backgroundImage: `url(${l.image})`, top: l.top, left: l.left, right: l.right, bottom: l.bottom }}
          />
        ))}
      </div>
      <style>{posterCss}</style>
    </div>
  )
}

const posterCss = `
.poster-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}
.poster {
  width: 288px;
  height: 570px;
  border-radius: 5px;
  box-shadow: 0 15px 10px rgba(0,0,0,0.3);
  overflow: hidden;
  position: relative;
  transform-style: preserve-3d;
  -webkit-transform: perspective(800px);
  transform: perspective(800px);
}
.poster .shine {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 100;
  pointer-events: none;
}
.poster .layer {
  position: absolute;
  background-size: 100% auto;
  background-repeat: no-repeat;
  background-position: 0 0;
  transition: 0.1s;
}
`

export const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: function NotFoundPage() {
    const jokes = [
      'Кажется, Иисус заблудился в ночной Москве. Айфон показывает «Маршрут не найден», навигатор молчит, а вокруг только хрущёвки и платные парковки. Он уже третью свечку ставит в храме Христа Спасителя просто чтобы спросить дорогу. Говорят, видели, как он пытался забить в Яндекс.Карты «Голгофа» — выдало «Голгофо-Петровский переулок». Может, вернёмся на главную и поможем бедняге?',
      'Иисус в Москве, ночью, с айфоном без заряда. Он уже прошёл Садовое кольцо три раза, ищет бесплатный Wi-Fi, чтобы отправить молитву наверх. Навигатор говорит «Вы на месте», а вокруг — только ночной клуб «Иуда» и шаурмичная «Тайная вечеря». Короче, 404 — страница не найдена. Как и дорога домой у этого бедолаги.',
      'Ночь. Москва. Иисус с айфоном. GPS глючит, карты не грузятся, метро закрыто. Он уже спрашивал дорогу у памятника Ленину — тот молчит как партизан. Пытался вызвать такси через «Везёт» — приехал осёл. В общем, страница не найдена, и Спаситель тоже немного заблудился. Нажмите сюда, чтобы вывести его к главной.',
    ]
    const joke = jokes[Math.floor(Math.random() * jokes.length)]

    return (
      <PageWrap activeNav="game" breadcrumbs={[{ label: '404' }]}>
        <div style={{ textAlign: 'center', padding: '24px 16px 40px' }}>
          <ParallaxPoster />
          <h1 style={{ fontSize: 48, margin: '0 0 12px', color: '#F9A253' }}>404</h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#666', maxWidth: 560, margin: '0 auto 24px' }}>
            {joke}
          </p>
          <Link to="/" style={{ color: '#F9A253', fontSize: 14, borderBottom: '1px dotted #F9A253', textDecoration: 'none' }}>
            На главную
          </Link>
        </div>
      </PageWrap>
    )
  },
})
