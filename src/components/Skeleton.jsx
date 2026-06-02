export default function Skeleton({ width, height, borderRadius, style }) {
  return (
    <div
      aria-hidden="true"
      className="skeleton"
      style={{
        width: width || '100%',
        height: height || 16,
        borderRadius: borderRadius !== undefined ? borderRadius : 'var(--radius-sm)',
        ...style,
      }}
    />
  )
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Skeleton width={40} height={40} borderRadius="50%" />
        <Skeleton width="40%" height={16} />
      </div>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height={12} style={{ marginBottom: 8 }} />
      ))}
    </div>
  )
}
