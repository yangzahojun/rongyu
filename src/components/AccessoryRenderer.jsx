export default function AccessoryRenderer({ items, width, height, interactive, onUpdateItem, onDeleteItem, selectedIdx, onSelect }) {
  if (!items || items.length === 0) return null

  return items.map((item, i) => {
    const isSelected = interactive && selectedIdx === i
    const x = item.x != null ? item.x : 50
    const y = item.y != null ? item.y : 10
    const s = item.s != null ? item.s : 1
    const r = item.r != null ? item.r : 0

    return (
      <div
        key={i}
        onPointerDown={(e) => {
          if (!interactive) { e.stopPropagation(); return }
          e.stopPropagation()
          onSelect(i)
        }}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: `translate(-50%, -50%) scale(${s}) rotate(${r}deg)`,
          fontSize: 24,
          pointerEvents: interactive ? 'auto' : 'none',
          cursor: interactive ? 'grab' : undefined,
          zIndex: isSelected ? 5 : 2,
          filter: isSelected ? 'drop-shadow(0 0 4px var(--color-brand-primary))' : undefined,
          transition: isSelected ? 'filter 0.15s' : undefined,
          userSelect: 'none',
        }}
      >
        {item.e}
      </div>
    )
  })
}
