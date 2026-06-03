import { ACC_FONT_RATIO } from '../outfitUtils'
import { SVG_CLOTHING } from '../svgClothing'

export default function AccessoryRenderer({ items, containerWidth }) {
  if (!items || items.length === 0) return null
  const baseFont = Math.round(containerWidth * ACC_FONT_RATIO)

  return items.map((item, i) => {
    const x = item.x ?? 50
    const y = item.y ?? 20
    const sv = item.s ?? 1
    const rv = item.r ?? 0
    const ov = item.o ?? 1
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
          transform: `translate(-50%, -50%) scale(${sv}) rotate(${rv}deg)`,
          fontSize: item.sv ? undefined : baseFont,
          width: item.sv ? baseFont * 1.8 : undefined,
          height: item.sv ? baseFont * 1.8 : undefined,
          zIndex: 2,
          pointerEvents: 'none',
          opacity: ov,
          userSelect: 'none',
          clipPath: hasClip ? `inset(${ct}% ${cr}% ${cb}% ${cl}%)` : undefined,
          overflow: hasClip ? 'hidden' : undefined,
        }}
      >
        {item.sv ? (
          <img src={SVG_CLOTHING[item.sv]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
        ) : (
          item.e
        )}
      </div>
    )
  })
}
