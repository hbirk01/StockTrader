import React, { useState, useMemo } from 'react'
import { Stars, Sparkline } from './ui'

const STAR_COLORS = { 5:'var(--accent)', 4:'var(--accent2)', 3:'var(--gold)', 2:'var(--accent3)', 1:'var(--muted)' }
const STAR_BG = { 5:'var(--accent)', 4:'var(--accent2)', 3:'var(--gold)', 2:'var(--accent3)', 1:'#3a3d45' }
const BUY_CLASS = { 5:'buy5', 4:'buy4', 3:'buy3', 2:'buy2', 1:'buy1' }
const STAR_LABELS = { 5:'Strong Buy', 4:'Buy', 3:'Hold', 2:'Reduce', 1:'Avoid' }

function RecCard({ stock }) {
  const [hovered, setHovered] = useState(false)
  const up = (stock.chg || 0) >= 0
  const upside = stock.price && stock.target
    ? (((stock.target - stock.price) / stock.price) * 100).toFixed(1)
    : null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:'var(--surface)',
        border:`1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius:12, padding:22, position:'relative', overflow:'hidden',
        transition:'all 0.25s', transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Top accent bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:STAR_BG[stock.stars] }} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20 }}>{stock.sym}</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{stock.name}</div>
        </div>
        <Stars n={stock.stars} />
      </div>

      <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:12 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:24 }}>
          {stock.price ? `$${stock.price.toFixed(2)}` : '—'}
        </div>
        {stock.price && (
          <div style={{
            fontSize:12, padding:'2px 8px', borderRadius:4,
            background: up ? 'rgba(61,220,132,0.1)' : 'rgba(255,78,78,0.1)',
            color: up ? 'var(--green)' : 'var(--red)',
          }}>
            {up ? '+' : ''}{(stock.chg || 0).toFixed(2)}%
          </div>
        )}
      </div>

      {/* Mini chart */}
      <div style={{ height:48, marginBottom:12 }}>
        <Sparkline chg={stock.chg || 0} height={48} />
      </div>

      {/* Tags */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
        {stock.tags?.map(t => (
          <span key={t} style={{
            fontSize:10, padding:'3px 9px', borderRadius:20,
            border: t.includes('AI') || t.includes('BOOM') || t.includes('REACCEL') || t.includes('LEADER') || t.includes('MONOPOLY')
              ? '1px solid rgba(200,241,53,0.3)' : t.includes('AVOID') || t.includes('CRISIS') || t.includes('WAIT')
              ? '1px solid rgba(255,107,74,0.3)' : '1px solid var(--border2)',
            color: t.includes('AI') || t.includes('BOOM') || t.includes('REACCEL') || t.includes('LEADER') || t.includes('MONOPOLY')
              ? 'var(--accent)' : t.includes('AVOID') || t.includes('CRISIS') || t.includes('WAIT')
              ? 'var(--accent3)' : 'var(--muted)',
          }}>{t}</span>
        ))}
      </div>

      {/* Reason */}
      <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7, marginBottom:16 }}>
        {stock.reason}
      </div>

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'0.06em' }}>PRICE TARGET</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:16 }}>${stock.target}</div>
          {upside && (
            <div style={{ fontSize:11, color: parseFloat(upside) > 0 ? 'var(--green)' : 'var(--red)' }}>
              {parseFloat(upside) > 0 ? '+' : ''}{upside}% upside
            </div>
          )}
        </div>
        <div style={{
          fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:6, letterSpacing:'0.05em',
          background: `${STAR_COLORS[stock.stars]}18`,
          color: STAR_COLORS[stock.stars],
          border: `1px solid ${STAR_COLORS[stock.stars]}30`,
        }}>
          {'★'.repeat(stock.stars)} {STAR_LABELS[stock.stars]}
        </div>
      </div>
    </div>
  )
}

export default function AIPicksTab({ stocks }) {
  const [filterStars, setFilterStars] = useState(0)

  const filtered = useMemo(() => {
    let data = [...stocks]
    if (filterStars) data = data.filter(s => s.stars === filterStars)
    return data.sort((a, b) => b.stars - a.stars)
  }, [stocks, filterStars])

  const filterBtns = [
    { stars: 0, label: 'All' },
    { stars: 5, label: '★★★★★ Strong Buy', color: 'var(--accent)', bg: 'rgba(200,241,53,0.08)', border: 'rgba(200,241,53,0.25)' },
    { stars: 4, label: '★★★★ Buy', color: 'var(--accent2)', bg: 'rgba(74,240,176,0.08)', border: 'rgba(74,240,176,0.25)' },
    { stars: 3, label: '★★★ Hold', color: 'var(--gold)', bg: 'rgba(240,192,64,0.08)', border: 'rgba(240,192,64,0.25)' },
    { stars: 2, label: '★★ Reduce', color: 'var(--accent3)', bg: 'rgba(255,107,74,0.08)', border: 'rgba(255,107,74,0.25)' },
    { stars: 1, label: '★ Avoid', color: 'var(--muted)', bg: 'var(--surface2)', border: 'var(--border)' },
  ]

  return (
    <div className="fade-in">
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, letterSpacing:'-0.02em', marginBottom:4 }}>
        AI Stock Picks
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:20 }}>
        Star ratings with full reasoning, price targets, and event catalysts. Updated continuously.
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
        {filterBtns.map(f => (
          <div
            key={f.stars}
            onClick={() => setFilterStars(f.stars)}
            style={{
              fontSize:11, padding:'6px 14px', borderRadius:20, cursor:'pointer',
              border: filterStars === f.stars
                ? `1px solid ${f.border || 'rgba(200,241,53,0.25)'}`
                : '1px solid var(--border2)',
              color: filterStars === f.stars ? (f.color || 'var(--accent)') : 'var(--muted)',
              background: filterStars === f.stars ? (f.bg || 'rgba(200,241,53,0.08)') : 'transparent',
              transition: 'all 0.2s',
            }}
          >{f.label} {f.stars === 0 && `(${stocks.length})`}</div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
        {filtered.map(s => <RecCard key={s.sym} stock={s} />)}
      </div>
    </div>
  )
}
