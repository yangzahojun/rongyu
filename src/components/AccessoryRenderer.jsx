import { ACC_FONT_RATIO } from '../outfitUtils'

export default function AccessoryRenderer({ items, containerWidth }) {
  if (!items || items.length === 0) return null
  const baseFont = Math.round(containerWidth * ACC_FONT_RATIO)

  return items.map((item, i) => {
    const x = item.x ?? 50
    const y = item.y ?? 20
    const s = item.s ?? 1
    const r = item.r ?? 0
    const o = item.o ?? 1
    const ct = item.ct ?? 0
    const cr = item.cr ?? 0
    const cb = item.cb ?? 0
    const cl = item.cl ?? 0
    const hasClip = ct > 0 || cr > 0 || cb > 0 || cl > 0

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: `translate(-50%, -50%) scale(${s}) rotate(${r}deg)`,
          fontSize: baseFont,
          zIndex: 2,
          pointerEvents: 'none',
          opacity: o,
          userSelect: 'none',
          clipPath: hasClip ? `inset(${ct}% ${cr}% ${cb}% ${cl}%)` : undefined,
          overflow: hasClip ? 'hidden' : undefined,
        }}
      >
        {item.e}
      </div>
    )
  })
}
