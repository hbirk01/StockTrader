import React, { useMemo } from 'react'

const SECTOR_PERF = [
  { n:'Technology', v:2.4 },
  { n:'Healthcare', v:1.1 },
  { n:'Consumer', v:-0.4 },
  { n:'Financials', v:0.3 },
  { n:'Energy', v:-1.6 },
  { n:'Industrials', v:0.8 },
  { n:'Defense', v:1.3 },
  { n:'Materials', v:0.5 },
]

const BREADTH = [
  { l:'Advancing', v:'318', c:'var(--green)' },
  { l:'Declining', v:'176', c:'var(--red)' },
  { l:'Unchanged', v:'6', c:'var(--muted)' },
  { l:'New 52W Highs', v:'47', c:'var(--accent)' },
  { l:'New 52W Lows', v:'12', c:'var(--accent3)' },
  { l:'Up/Down Vol Ratio', v:'1.81x', c:'var(--accent2)' },
]

function HeatCell({ s }) {
  const v = s.chg || 0
  const intensity = Math.min(Math.abs(v) / 5, 1)
  let bg, tc
  if (v > 0) {
    const g = Math.round(60 + intensity * 120)
    bg = `rgba(0,${g},50,${0.3 + intensity * 0.5})`
    tc = 'rgb(61,220,132)'
  } else {
    const r = Math.round(100 + intensity * 100)
    bg = `rgba(${r},20,20,${0.3 + intensity * 0.5})`
    tc = 'rgb(255,100,100)'
  }
  return (
    <div
      title={`${s.name}: ${v > 0 ? '+' : ''}${v.toFixed(2)}%`}
      style={{
        background: bg,
        border: `1px solid ${v > 0 ? 'rgba(61,220,132,0.2)' : 'rgba(255,78,78,0.2)'}`,
        borderRadius: 6, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        cursor:'pointer', transition:'all 0.2s', padding: 6,
        aspectRatio: '1.2',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.zIndex = '5'; e.currentTarget.style.position = 'relative' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.zIndex = ''; e.currentTarget.style.position = '' }}
    >
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, fontWeight:700, color:tc }}>{s.sym}</div>
      <div style={{ fontSize:9, marginTop:1, color:tc }}>{v > 0 ? '+' : ''}{v.toFixed(1)}%</div>
    </div>
  )
}

export default function HeatmapTab({ stocks }) {
  return (
    <div className="fade-in">
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, letterSpacing:'-0.02em', marginBottom:4 }}>
        Market Heatmap
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:20 }}>
        Color intensity = today's % change. Green = gaining, Red = losing.
      </div>

      {/* Legend */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
        <span style={{ fontSize:11, color:'var(--muted)' }}>−5%</span>
        <div style={{ width:160, height:8, borderRadius:4, background:'linear-gradient(to right,#c0392b,#5a3535,#1a2a1a,#1a5c3a,#27ae60)' }} />
        <span style={{ fontSize:11, color:'var(--muted)' }}>+5%</span>
      </div>

      {/* Heatmap grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(72px, 1fr))', gap:4, marginBottom:24 }}>
        {stocks.map(s => <HeatCell key={s.sym} s={s} />)}
      </div>

      {/* Bottom panels */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Sector performance */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:16 }}>Sector Performance</div>
          {SECTOR_PERF.map(s => {
            const up = s.v >= 0
            const w = Math.abs(s.v) / 3 * 50
            return (
              <div key={s.n} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:100, fontSize:11, color:'var(--muted)' }}>{s.n}</div>
                <div style={{ flex:1, height:6, background:'var(--surface2)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${w + 50}%`, background: up ? 'var(--green)' : 'var(--red)', borderRadius:3 }} />
                </div>
                <div style={{ fontSize:11, minWidth:40, textAlign:'right', color: up ? 'var(--green)' : 'var(--red)' }}>
                  {up ? '+' : ''}{s.v}%
                </div>
              </div>
            )
          })}
        </div>

        {/* Breadth Indicators */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:16 }}>Breadth Indicators</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {BREADTH.map(b => (
              <div key={b.l} style={{ background:'var(--surface2)', borderRadius:8, padding:12, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4 }}>{b.l}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:b.c }}>{b.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
