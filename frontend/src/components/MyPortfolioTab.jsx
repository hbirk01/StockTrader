import React, { useMemo } from 'react'
import { Stars } from './ui'

const MY_PORTFOLIO = [
  { sym:'NVDA', name:'Nvidia', shares:15, cost:612, stars:5 },
  { sym:'AAPL', name:'Apple', shares:40, cost:155, stars:4 },
  { sym:'META', name:'Meta', shares:20, cost:350, stars:5 },
  { sym:'MSFT', name:'Microsoft', shares:25, cost:380, stars:4 },
  { sym:'LLY', name:'Eli Lilly', shares:8, cost:590, stars:5 },
  { sym:'AMZN', name:'Amazon', shares:18, cost:142, stars:5 },
]

function fmt(n) {
  return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export default function MyPortfolioTab({ stocks }) {
  const holdings = useMemo(() => {
    const mapped = MY_PORTFOLIO.map(h => {
      const live = stocks.find(s => s.sym === h.sym)
      const price = live?.price || h.cost
      const val = h.shares * price
      const pnl = (price - h.cost) * h.shares
      const pnlPct = ((price - h.cost) / h.cost * 100).toFixed(1)
      return { ...h, price, val, pnl, pnlPct }
    })
    return mapped
  }, [stocks])

  const totalVal = holdings.reduce((a, h) => a + h.val, 0)
  const totalCost = MY_PORTFOLIO.reduce((a, h) => a + h.shares * h.cost, 0)
  const totalPnl = totalVal - totalCost
  const totalPnlPct = ((totalPnl / totalCost) * 100).toFixed(1)
  const dayPnl = holdings.reduce((a, h) => {
    const live = stocks.find(s => s.sym === h.sym)
    return a + (live ? (live.chg / 100) * h.val : 0)
  }, 0)
  const dayPnlPct = ((dayPnl / totalVal) * 100).toFixed(2)

  const stats = [
    { label:'Total Value', value:`$${fmt(totalVal)}`, sub: dayPnl >= 0 ? `▲ +$${fmt(Math.abs(dayPnl))} today` : `▼ -$${fmt(Math.abs(dayPnl))} today`, subColor: dayPnl >= 0 ? 'var(--green)' : 'var(--red)' },
    { label:'Total Return', value:`${parseFloat(totalPnlPct) >= 0 ? '+' : ''}${totalPnlPct}%`, valueColor: parseFloat(totalPnlPct) >= 0 ? 'var(--green)' : 'var(--red)', sub:'Since inception', subColor:'var(--muted)' },
    { label:'Day P&L', value:`${dayPnl >= 0 ? '+' : '-'}$${fmt(Math.abs(dayPnl))}`, valueColor: dayPnl >= 0 ? 'var(--green)' : 'var(--red)', sub:`${dayPnl >= 0 ? '+' : ''}${dayPnlPct}% today`, subColor: dayPnl >= 0 ? 'var(--green)' : 'var(--red)' },
    { label:'AI Risk Score', value:'Moderate', valueColor:'var(--gold)', sub:'Diversification: 7.2/10', subColor:'var(--muted)' },
  ]

  return (
    <div className="fade-in">
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, letterSpacing:'-0.02em', marginBottom:4 }}>My Portfolio</div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>Track your holdings with real-time P&L and AI-generated risk assessment.</div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12, marginBottom:24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'18px 20px' }}>
            <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'0.06em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:700, letterSpacing:'-0.02em', color:s.valueColor || 'var(--text)' }}>{s.value}</div>
            {s.sub && <div style={{ fontSize:11, marginTop:6, color:s.subColor || 'var(--muted)' }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Holdings table */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr>
                {['SYMBOL','SHARES','AVG COST','CURRENT','VALUE','P&L','WEIGHT','AI RATING'].map(h => (
                  <th key={h} style={{ fontSize:10, color:'var(--muted)', letterSpacing:'0.08em', textAlign:'left', padding:'10px 14px', borderBottom:'1px solid var(--border)', fontWeight:400, whiteSpace:'nowrap', background:'var(--surface2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => {
                const up = h.pnl >= 0
                const weight = ((h.val / totalVal) * 100).toFixed(1)
                return (
                  <tr key={h.sym}
                    onMouseEnter={e => { Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'var(--surface2)') }}
                    onMouseLeave={e => { Array.from(e.currentTarget.cells).forEach(td => td.style.background = '') }}
                  >
                    <td style={{ padding:14, borderBottom:'1px solid var(--border)', verticalAlign:'middle' }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15 }}>{h.sym}</div>
                      <div style={{ fontSize:11, color:'var(--muted)' }}>{h.name}</div>
                    </td>
                    <td style={{ padding:14, borderBottom:'1px solid var(--border)', fontSize:13 }}>{h.shares}</td>
                    <td style={{ padding:14, borderBottom:'1px solid var(--border)', fontSize:13 }}>${h.cost.toFixed(2)}</td>
                    <td style={{ padding:14, borderBottom:'1px solid var(--border)', fontSize:13 }}>${h.price.toFixed(2)}</td>
                    <td style={{ padding:14, borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:500 }}>${fmt(h.val)}</td>
                    <td style={{ padding:14, borderBottom:'1px solid var(--border)', fontSize:13, color: up ? 'var(--green)' : 'var(--red)' }}>
                      {up ? '+' : '-'} ${fmt(Math.abs(h.pnl))} ({up ? '+' : ''}{h.pnlPct}%)
                    </td>
                    <td style={{ padding:14, borderBottom:'1px solid var(--border)', fontSize:12 }}>
                      <div style={{ marginBottom:4 }}>{weight}%</div>
                      <div style={{ width:80, height:4, background:'var(--surface2)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${weight}%`, background: up ? 'var(--green)' : 'var(--red)', borderRadius:2 }} />
                      </div>
                    </td>
                    <td style={{ padding:14, borderBottom:'1px solid var(--border)' }}>
                      <Stars n={h.stars} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop:16, padding:'12px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:11, color:'var(--muted)', lineHeight:1.7 }}>
        ℹ️ This is a demo portfolio for illustrative purposes. Holdings shown are not financial advice.
      </div>
    </div>
  )
}
