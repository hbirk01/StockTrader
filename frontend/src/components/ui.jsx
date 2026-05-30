import React from 'react'

export function Stars({ n }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{
          fontSize: 13,
          color: i <= n ? 'var(--gold)' : '#2a2d35'
        }}>★</span>
      ))}
    </div>
  )
}

export function Badge({ children, color = 'var(--muted)', bg }) {
  return (
    <span style={{
      fontSize: 10,
      padding: '2px 8px',
      borderRadius: 20,
      border: `1px solid ${color}40`,
      color,
      background: bg || `${color}12`,
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

export function Card({ children, style, hover = true }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: 20,
        transition: 'border-color 0.2s',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, valueColor = 'var(--text)' }) {
  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '18px 20px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: valueColor,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, marginTop: 6, color: 'var(--muted)' }}>{sub}</div>}
    </div>
  )
}

export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      display: 'inline-block',
    }} />
  )
}

export function Sparkline({ chg, width = 120, height = 48 }) {
  const up = chg >= 0
  const pts = []
  let v = 50
  for (let i = 0; i < 21; i++) {
    v += (Math.random() - (up ? 0.45 : 0.55)) * 8
    v = Math.max(10, Math.min(90, v))
    pts.push(v)
  }
  const step = width / (pts.length - 1)
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * step},${height - (p / 100) * height}`).join(' ')
  const color = up ? '#3ddc84' : '#ff4e4e'
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function formatPrice(p) {
  if (p == null) return '—'
  return '$' + Number(p).toFixed(2)
}

export function formatMktCap(n) {
  if (!n) return '—'
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(0) + 'M'
  return '$' + n
}

export function formatVol(n) {
  if (!n) return '—'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(n)
}

export function pctOf52W(price, high) {
  if (!price || !high) return null
  return ((price / high) * 100).toFixed(0) + '%'
}
