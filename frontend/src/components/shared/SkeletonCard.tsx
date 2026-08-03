export const SkeletonCard = ({ rows = 4 }: { rows?: number }) => (
  <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div className="skeleton" style={{ height: 24, width: '60%' }} />
    <div className="skeleton" style={{ height: 16, width: '90%' }} />
    {Array.from({ length: rows - 2 }).map((_, i) => (
      <div key={i} className="skeleton" style={{ height: 14, width: `${70 + (i % 3) * 10}%` }} />
    ))}
  </div>
)

export const SkeletonGrid = ({ count = 3 }: { count?: number }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} rows={5} />
    ))}
  </div>
)
