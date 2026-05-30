import React, { useState, useMemo } from 'react'
import { Stars, Badge, Sparkline, formatPrice, formatMktCap, pctOf52W } from './ui'

const STAR_LABELS = { 5: 'Strong Buy', 4: 'Buy', 3: 'Hold', 2: 'Reduce', 1: 'Avoid' }
const STAR_COLORS = { 5: 'var(--accent)', 4: 'var(--accent2)', 3: 'var(--gold)', 2: 'var(--accent3)', 1: 'var(--muted)' }
const TOP_BORDER  = { 5: 'var(--accent)', 4: 'var(--accent2)', 3: 'var(--gold)', 2: 'var(--accent3)', 1: '#3a3d45' }

const SENTIMENT_STYLE = {
  bullish: { color: 'var(--green)',   bg: 'rgba(61,220,132,0.1)',  border: 'rgba(61,220,132,0.25)',  icon: '▲' },
  bearish: { color: 'var(--red)',     bg: 'rgba(255,78,78,0.1)',   border: 'rgba(255,78,78,0.25)',   icon: '▼' },
  neutral: { color: 'var(--muted)',   bg: 'var(--surface2)',       border: 'var(--border)',          icon: '◆' },
}

function StockCard({ stock, sentiment }) {
  const [hovered, setHovered] = useState(false)
  const up = (stock.chg || 0) >= 0
  const upside = stock.price && stock.target
    ? (((stock.target - stock.price) / stock.price) * 100).toFixed(1)
    : null
  const w52pct = pctOf52W(stock.price, stock.year_high)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: 18,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: TOP_BORDER[stock.stars],
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18 }}>
            {stock.sym}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{stock.name}</div>
        </div>
        <Stars n={stock.stars} />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22,
          color: (stock.chg || 0) > 0 ? 'var(--green)' : (stock.chg || 0) < 0 ? 'var(--red)' : 'var(--text)',
          transition: 'color 0.8s',
        }}>
          {stock.price ? formatPrice(stock.price) : '—'}
        </div>
        {stock.price && (
          <div style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 4,
            background: up ? 'rgba(61,220,132,0.1)' : 'rgba(255,78,78,0.1)',
            color: up ? 'var(--green)' : 'var(--red)',
          }}>
            {up ? '+' : ''}{(stock.chg || 0).toFixed(2)}%
          </div>
        )}
      </div>

      <div style={{ height: 40, marginBottom: 8 }}>
        <Sparkline chg={stock.chg || 0} height={40} />
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {stock.tags?.map(t => (
          <Badge
            key={t}
            color={t.includes('AI') || t.includes('BOOM') || t.includes('REACCEL') ? 'var(--accent)'
              : t.includes('AVOID') || t.includes('CRISIS') || t.includes('WAIT') ? 'var(--accent3)'
              : 'var(--muted)'}
          >
            {t}
          </Badge>
        ))}
      </div>

      {/* News sentiment badge */}
      {sentiment && (() => {
        const s = SENTIMENT_STYLE[sentiment]
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
              color: s.color, background: s.bg, border: `1px solid ${s.border}`,
            }}>
              {s.icon} NEWS {sentiment.toUpperCase()}
            </span>
          </div>
        )
      })()}

      {/* Fundamentals row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
        {[
          ['P/E', stock.pe ? stock.pe.toFixed(1) + 'x' : '—'],
          ['52W', w52pct || '—'],
          ['CAP', formatMktCap(stock.market_cap)],
        ].map(([label, val]) => (
          <div key={label} style={{
            background: 'var(--surface2)', borderRadius: 5, padding: '5px 7px', fontSize: 10,
          }}>
            <div style={{ color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontWeight: 500 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid var(--border)', paddingTop: 10,
      }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em' }}>TARGET</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14 }}>
            ${stock.target}
          </div>
          {upside && (
            <div style={{ fontSize: 10, color: parseFloat(upside) > 0 ? 'var(--green)' : 'var(--red)' }}>
              {parseFloat(upside) > 0 ? '+' : ''}{upside}%
            </div>
          )}
        </div>
        <div style={{
          fontSize: 10, color: 'var(--muted)', padding: '2px 8px',
          background: 'var(--surface2)', borderRadius: 4,
        }}>
          {stock.sector}
        </div>
      </div>
    </div>
  )
}

export default function StocksTab({ stocks, newsSentiment = {} }) {
  const [filterStars, setFilterStars] = useState(0)
  const [filterSector, setFilterSector] = useState('')
  const [sort, setSort] = useState('stars-desc')

  const sectors = useMemo(() => [...new Set(stocks.map(s => s.sector))].sort(), [stocks])

  const filtered = useMemo(() => {
    let data = [...stocks]
    if (filterStars) data = data.filter(s => s.stars === filterStars)
    if (filterSector) data = data.filter(s => s.sector === filterSector)
    switch (sort) {
      case 'stars-desc': data.sort((a,b) => b.stars - a.stars); break
      case 'stars-asc':  data.sort((a,b) => a.stars - b.stars); break
      case 'chg-desc':   data.sort((a,b) => (b.chg||0) - (a.chg||0)); break
      case 'chg-asc':    data.sort((a,b) => (a.chg||0) - (b.chg||0)); break
      case 'price-desc': data.sort((a,b) => (b.price||0) - (a.price||0)); break
      case 'alpha':      data.sort((a,b) => a.sym.localeCompare(b.sym)); break
    }
    return data
  }, [stocks, filterStars, filterSector, sort])

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>
            All Stocks — Live Prices
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
            {filtered.length} of {stocks.length} stocks · Alpaca · FMP
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, margin: '20px 0', flexWrap: 'wrap', alignItems: 'center' }}>
        {[0,5,4,3,2,1].map(n => (
          <button
            key={n}
            onClick={() => setFilterStars(n)}
            style={{
              fontSize: 11, padding: '5px 14px', borderRadius: 20,
              border: `1px solid ${filterStars === n ? 'rgba(200,241,53,0.35)' : 'var(--border)'}`,
              background: filterStars === n ? 'rgba(200,241,53,0.08)' : 'var(--surface2)',
              color: filterStars === n ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            {n === 0 ? `All (${stocks.length})` : `${'★'.repeat(n)} ${STAR_LABELS[n]}`}
          </button>
        ))}

        <select
          value={filterSector}
          onChange={e => setFilterSector(e.target.value)}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border2)',
            color: 'var(--text)', fontSize: 11, padding: '5px 10px', borderRadius: 6,
          }}
        >
          <option value="">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border2)',
            color: 'var(--text)', fontSize: 11, padding: '5px 10px', borderRadius: 6,
            marginLeft: 'auto',
          }}
        >
          <option value="stars-desc">Sort: Stars ↓</option>
          <option value="stars-asc">Stars ↑</option>
          <option value="chg-desc">Change % ↓</option>
          <option value="chg-asc">Change % ↑</option>
          <option value="price-desc">Price ↓</option>
          <option value="alpha">A–Z</option>
        </select>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: 14,
      }}>
        {filtered.map(s => <StockCard key={s.sym} stock={s} sentiment={newsSentiment[s.sym] || null} />)}
      </div>
    </div>
  )
}
