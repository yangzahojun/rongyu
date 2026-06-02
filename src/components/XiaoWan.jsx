import { useState, useEffect, useCallback } from 'react'

const FRAMES = ['xiaowan-run1.png', 'xiaowan-run2.png', 'xiaowan-run3.png', 'xiaowan-run4.png', 'xiaowan-run5.png']
const FRAME_INTERVAL = 180

const MESSAGES = [
  '今天也是元气满满的一天!',
  '加油！你是最棒的!',
  '支教路上有你真好!',
  '来写一篇日记吧!',
  '别忘了今天的课程哦!',
  '小弯为你感到骄傲!',
  '记得喝水休息一下!',
  '每个孩子都因为你而不同!',
  '一起记录美好时光!',
  '你的付出闪闪发光!',
  '嘿嘿，被我发现啦!',
  '蓉育向阳，一路有你!',
]

export default function XiaoWan() {
  const [frame, setFrame] = useState(0)
  const [msg, setMsg] = useState(null)
  const [bounce, setBounce] = useState(false)
  const [petals, setPetals] = useState([])

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % 5)
    }, FRAME_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  const handleClick = useCallback(() => {
    const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
    setMsg(randomMsg)
    setBounce(true)
    setTimeout(() => setBounce(false), 600)

    const newPetals = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      px: `${(Math.random() - 0.5) * 120}px`,
      py: `${-(Math.random() * 80 + 30)}px`,
      delay: Math.random() * 0.3,
    }))
    setPetals((prev) => [...prev, ...newPetals])
    setTimeout(() => {
      setPetals((prev) => prev.filter((p) => !newPetals.includes(p)))
    }, 1500)

    setTimeout(() => setMsg(null), 2500)
  }, [])

  return (
    <>
      <div
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
        role="button"
        tabIndex={0}
        aria-label="点击小弯获得鼓励"
        className={bounce ? 'xiaowan-bounce' : ''}
        style={{
          position: 'fixed',
          bottom: 56,
          zIndex: 150,
          cursor: 'pointer',
          animation: 'xiaowanRun 60s linear infinite',
        }}
      >
        <img src={FRAMES[frame]} alt="小弯" style={{
          height: 44,
          display: 'block',
          filter: 'drop-shadow(0 2px 4px rgba(255,182,193,0.4))',
        }} />

        {petals.map((p) => (
          <span key={p.id} style={{
            position: 'absolute',
            top: 0, left: '50%',
            fontSize: 16, pointerEvents: 'none',
            '--px': p.px, '--py': p.py,
            animation: `petalBurst 1.2s ${p.delay}s ease-out forwards`,
          }}>&#x1F338;</span>
        ))}
      </div>

      {msg && (
        <div style={{
          position: 'fixed',
          bottom: 106,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 151,
          pointerEvents: 'none',
        }}>
          <div style={{
            background: 'var(--color-surface-card)',
            borderRadius: 14,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-brand-emphasis)',
            boxShadow: '0 4px 16px rgba(255,182,193,0.3)',
            whiteSpace: 'nowrap',
            animation: 'bubbleIn 0.4s ease-out',
          }}>
            {msg}
            <div style={{
              position: 'absolute',
              bottom: -6, left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid var(--color-surface-card)',
            }} />
          </div>
        </div>
      )}
    </>
  )
}
