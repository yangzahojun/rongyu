import { useMemo } from 'react'

const PARTICLES = ['🌸', '✨', '🦋', '💫', '🍀', '⭐', '🌺', '🪷', '💖']

// 预生成配粒子数据
const pool = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  e: PARTICLES[i % PARTICLES.length],
  left: 5 + (i * 17) % 90,
  bottom: 10 + (i * 23) % 75,
  delay: i * 1.2,
  dur: 4 + (i * 0.7) % 6,
  size: 10 + (i * 3) % 10,
  dx: ((i * 7) % 60) - 30,
  dy: -30 - (i * 9) % 60,
  dr: ((i * 13) % 120) - 60,
}))

export default function FloatingParticles({ count = 10 }) {
  const items = useMemo(() => pool.slice(0, count), [count])

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      overflow: 'hidden', zIndex: 0,
    }} aria-hidden="true">
      {items.map(p => (
        <span
          key={p.id}
          className="float-particle"
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            bottom: `${p.bottom}%`,
            fontSize: p.size,
            animationName: 'particle-drift',
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
          }}
        >
          {p.e}
        </span>
      ))}
    </div>
  )
}
