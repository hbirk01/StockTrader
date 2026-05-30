import React, { useState, useMemo } from 'react'
import { Stars } from './ui'

const SCORE_STYLE = {
  5: { bg:'rgba(200,241,53,0.15)', color:'var(--accent)' },
  4: { bg:'rgba(74,240,176,0.15)', color:'var(--accent2)' },
  3: { bg:'rgba(240,192,64,0.15)', color:'var(--gold)' },
  2: { bg:'rgba(255,107,74,0.15)', color:'var(--accent3)' },
  1: { bg:'rgba(122,127,142,0.12)', color:'var(--muted)' },
}

export default function ScreenerTab({ stocks }) {
  const [sector, setSector] = useState('')
  const [minStars, setMinStars] = useState('')
  const [sortCol, setSortCol] = useState('stars')
  const [sortDir, setSortDir] = useState('desc')

  const sectors = useMemo(() => [...new Set(stocks.map(s => s.sector))].sort(), [stocks])

  const filtered = useMemo(() => {
    let data = [...stocks]
    if (sector) data = data.filter(s => s.sector === sector)
    if (minStars) data = data.filter(s => s.stars >= parseInt(minStars))
    data.sort((a, b) => {
      let va, vb
      if (sortCol === 'stars') { va = a.stars; vb = b.stars }
      else if (sortCol === 'chg') { va = a.chg || 0; vb = b.chg || 0 }
      else if (sortCol === 'price') { va = a.price || 0; vb = b.price || 0 }
      else if (sortCol === 'sym') { return sortDir === 'asc' ? a.sym.localeCompare(b.sym) : b.sym.localeCompare(a.sym) }
      else { va = a[sortCol] || 0; vb = b[sortCol] || 0 }
      return sortDir === 'desc' ? vb - va : va - vb
    })
    return data
  }, [stocks, sector, minStars, sortCol, sortDir])

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const thStyle = { background:'var(--surface2)', fontSize:10, color:'var(--muted)', letterSpacing:'0.08em', textAlign:'left', padding:'12px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }
  const tdStyle = { padding:'12px 16px', borderBottom:'1px solid var(--border)', fontSize:12 }

  return (
    <div className="fade-in">
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, letterSpacing:'-0.02em', marginBottom:4 }}>
        Stock Screener
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:20 }}>
        Filter by sector, rating, market cap. AI scores reflect fundamentals + event impact.
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        <select
          value={sector}
          onChange={e => setSector(e.target.value)}
          style={{ background:'var(--surface)', border:'1px solid var(--border2)', color:'var(--text)', fontSize:12, padding:'8px 12px', borderRadius:6, cursor:'pointer', outline:'none' }}
        >
          <option value="">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={minStars}
          onChange={e => setMinStars(e.target.value)}
          style={{ background:'var(--surface)', border:'1px solid var(--border2)', color:'var(--text)', fontSize:12, padding:'8px 12px', borderRadius:6, cursor:'pointer', outline:'none' }}
        >
          <option value="">Any Rating</option>
          <option value="5">★★★★★ Only</option>
          <option value="4">★★★★ & Up</option>
          <option value="3">★★★ & Up</option>
        </select>

        <div style={{ marginLeft:'auto', fontSize:11, color:'var(--muted)' }}>
          {filtered.length} of {stocks.length} stocks
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr>
                {[
                  { key:'sym', label:'SYMBOL' },
                  { key:'name', label:'COMPANY' },
                  { key:'sector', label:'SECTOR' },
                  { key:'price', label:'PRICE' },
                  { key:'chg', label:'CHANGE' },
                  { key:'mktcap', label:'MKT CAP' },
                  { key:'pe', label:'P/E' },
                  { key:'52w', label:'52W HIGH' },
                  { key:'stars', label:'AI SCORE' },
                  { key:'catalyst', label:'CATALYST' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ ...thStyle, color: sortCol === col.key ? 'var(--text)' : 'var(--muted)' }}
                  >
                    {col.label} {sortCol === col.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const up = (s.chg || 0) >= 0
                const pct52 = s.price && s.year_high ? ((s.price / s.year_high) * 100).toFixed(0) : null
                const ss = SCORE_STYLE[s.stars]
                return (
                  <tr key={s.sym}
                    onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'var(--surface2)')}
                    onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = '')}
                  >
                    <td style={{ ...tdStyle, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14 }}>{s.sym}</td>
                    <td style={{ ...tdStyle, color:'var(--muted)', fontSize:11, maxWidth:160 }}>{s.name}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, border:'1px solid var(--border2)', color:'var(--muted)' }}>{s.sector}</span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight:500 }}>{s.price ? `$${s.price.toFixed(2)}` : '—'}</td>
                    <td style={{ ...tdStyle, color: up ? 'var(--green)' : 'var(--red)' }}>
                      {up ? '+' : ''}{(s.chg || 0).toFixed(2)}%
                    </td>
                    <td style={tdStyle}>{s.market_cap ? (s.market_cap >= 1e12 ? `$${(s.market_cap/1e12).toFixed(1)}T` : `$${(s.market_cap/1e9).toFixed(0)}B`) : '—'}</td>
                    <td style={{ ...tdStyle, color:'var(--muted)' }}>{s.pe ? `${s.pe.toFixed(1)}x` : '—'}</td>
                    <td style={tdStyle}>
                      {pct52 ? (
                        <div>
                          <div style={{ fontSize:11, marginBottom:3 }}>{pct52}% of 52W</div>
                          <div style={{ height:3, background:'var(--surface2)', borderRadius:2, overflow:'hidden', width:80 }}>
                            <div style={{ height:'100%', width:`${Math.min(pct52,100)}%`, background: pct52 > 80 ? 'var(--green)' : 'var(--gold)', borderRadius:2 }} />
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:6, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, background:ss.bg, color:ss.color }}>
                        {s.stars}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color:'var(--muted)', maxWidth:140, fontSize:11 }}>{s.tags?.[0]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
