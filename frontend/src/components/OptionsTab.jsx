import React, { useState, useMemo } from 'react'

const OPTIONS_FLOW = [
  {sym:'NVDA',type:'call',strike:950,expiry:'2024-06-21',premium:42.80,contracts:2847,oi:8200,vol_oi:3.47,totalPremium:'$12.2M',sentiment:'bullish',orderType:'sweep',unusual:true,time:'09:34',note:'Aggressive sweep across 4 exchanges. 3.4x avg volume. Expiring in-the-money if NVDA holds $950.'},
  {sym:'META',type:'call',strike:520,expiry:'2024-07-19',premium:18.50,contracts:1500,oi:4100,vol_oi:3.66,totalPremium:'$2.8M',sentiment:'bullish',orderType:'block',unusual:true,time:'10:12',note:'Single block trade. Institutional positioning ahead of Q2 earnings. Bullish continuation bet.'},
  {sym:'TSLA',type:'put',strike:160,expiry:'2024-06-28',premium:8.20,contracts:3200,oi:6800,vol_oi:4.71,totalPremium:'$2.6M',sentiment:'bearish',orderType:'sweep',unusual:true,time:'11:03',note:'Large put sweep. Protection or directional bet. Targets ~10% downside from current levels.'},
  {sym:'AMZN',type:'call',strike:200,expiry:'2024-08-16',premium:6.40,contracts:4100,oi:9200,vol_oi:4.46,totalPremium:'$2.6M',sentiment:'bullish',orderType:'sweep',unusual:true,time:'09:58',note:'AWS re-acceleration play. Call buyers targeting $200 breakout level.'},
  {sym:'AAPL',type:'call',strike:195,expiry:'2024-06-21',premium:3.80,contracts:8500,oi:12000,vol_oi:7.08,totalPremium:'$3.2M',sentiment:'bullish',orderType:'block',unusual:true,time:'13:22',note:'Massive call block. 7x OI ratio extremely unusual. Possible insider positioning ahead of WWDC.'},
  {sym:'INTC',type:'put',strike:28,expiry:'2024-07-19',premium:2.10,contracts:5600,oi:7800,vol_oi:7.18,totalPremium:'$1.2M',sentiment:'bearish',orderType:'sweep',unusual:true,time:'14:05',note:'Bear sweep targeting further downside. 18A delay news catalyst. 7x OI ratio screams conviction.'},
  {sym:'LLY',type:'call',strike:800,expiry:'2024-09-20',premium:28.40,contracts:890,oi:2100,vol_oi:4.24,totalPremium:'$2.5M',sentiment:'bullish',orderType:'block',unusual:true,time:'10:45',note:'Long-dated call block. Targeting $800 by September — Donanemab approval catalyst.'},
  {sym:'JPM',type:'call',strike:210,expiry:'2024-07-19',premium:4.20,contracts:2200,oi:5400,vol_oi:4.07,totalPremium:'$0.9M',sentiment:'bullish',orderType:'sweep',unusual:false,time:'11:30',note:'Banks call sweep ahead of Fed rate decision. Positioned for NIM expansion continuation.'},
  {sym:'AMD',type:'call',strike:175,expiry:'2024-06-28',premium:5.60,contracts:3800,oi:6200,vol_oi:6.13,totalPremium:'$2.1M',sentiment:'bullish',orderType:'sweep',unusual:true,time:'09:42',note:'MI300X demand story continuation. Sweeping calls ahead of data center revenue update.'},
  {sym:'GOOGL',type:'put',strike:155,expiry:'2024-06-21',premium:3.10,contracts:4400,oi:8900,vol_oi:4.94,totalPremium:'$1.4M',sentiment:'bearish',orderType:'block',unusual:true,time:'15:01',note:'Hedging or directional. Near-term put block suggests caution around AI monetization timeline.'},
  {sym:'XOM',type:'put',strike:110,expiry:'2024-07-19',premium:2.80,contracts:3100,oi:5400,vol_oi:5.74,totalPremium:'$0.9M',sentiment:'bearish',orderType:'sweep',unusual:true,time:'12:18',note:'Oil weakness bet. $76/bbl Brent — puts targeting further downside if demand slows.'},
  {sym:'MSFT',type:'call',strike:430,expiry:'2024-08-16',premium:9.20,contracts:1700,oi:4800,vol_oi:3.54,totalPremium:'$1.6M',sentiment:'bullish',orderType:'block',unusual:false,time:'10:22',note:'Copilot + Azure re-acceleration thesis. Long-dated call buying on pullback.'},
]

function parsePremium(str) {
  return parseFloat(str.replace(/[$M]/g, ''))
}

function FiltBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      fontSize:11, padding:'5px 14px', borderRadius:20, cursor:'pointer',
      border:`1px solid ${active ? 'rgba(200,241,53,0.35)' : 'var(--border)'}`,
      background: active ? 'rgba(200,241,53,0.08)' : 'var(--surface2)',
      color: active ? 'var(--accent)' : 'var(--muted)',
      transition:'all 0.2s',
    }}>{children}</button>
  )
}

export default function OptionsTab() {
  const [filter, setFilter] = useState('all')
  const [tooltip, setTooltip] = useState(null)

  const filtered = useMemo(() => {
    if (filter === 'bullish') return OPTIONS_FLOW.filter(o => o.sentiment === 'bullish')
    if (filter === 'bearish') return OPTIONS_FLOW.filter(o => o.sentiment === 'bearish')
    if (filter === 'sweep') return OPTIONS_FLOW.filter(o => o.orderType === 'sweep')
    if (filter === 'block') return OPTIONS_FLOW.filter(o => o.orderType === 'block')
    return OPTIONS_FLOW
  }, [filter])

  const totalBullPrem = OPTIONS_FLOW.filter(o => o.sentiment === 'bullish').reduce((a, o) => a + parsePremium(o.totalPremium), 0)
  const totalBearPrem = OPTIONS_FLOW.filter(o => o.sentiment === 'bearish').reduce((a, o) => a + parsePremium(o.totalPremium), 0)
  const sweeps = OPTIONS_FLOW.filter(o => o.orderType === 'sweep').length
  const unusual = OPTIONS_FLOW.filter(o => o.unusual).length

  const summaryCards = [
    { l:'Bullish Premium', v:`$${totalBullPrem.toFixed(1)}M`, c:'var(--green)', icon:'📈' },
    { l:'Bearish Premium', v:`$${totalBearPrem.toFixed(1)}M`, c:'var(--red)', icon:'📉' },
    { l:'Sweep Orders', v:sweeps, c:'var(--accent)', icon:'⚡' },
    { l:'Unusual Activity', v:`${unusual} alerts`, c:'var(--gold)', icon:'🚨' },
  ]

  const thStyle = { background:'var(--surface2)', fontSize:10, color:'var(--muted)', letterSpacing:'0.06em', padding:'10px 14px', borderBottom:'1px solid var(--border)', textAlign:'left', whiteSpace:'nowrap' }
  const tdStyle = { padding:'12px 14px', borderBottom:'1px solid var(--border)', fontSize:12 }

  return (
    <div className="fade-in">
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, letterSpacing:'-0.02em', marginBottom:4 }}>
        Unusual Options Flow
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:20 }}>
        Large block options trades flagged as unusual. Smart money bets detected via volume vs open interest ratio, expiry, and premium size. Bullish = calls, Bearish = puts.
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {[
          { id:'all', label:'All Flow' },
          { id:'bullish', label:'🟢 Bullish' },
          { id:'bearish', label:'🔴 Bearish' },
          { id:'sweep', label:'⚡ Sweeps' },
          { id:'block', label:'🧱 Blocks' },
        ].map(f => <FiltBtn key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</FiltBtn>)}
        <div style={{ marginLeft:'auto', fontSize:11, color:'var(--muted)', padding:'6px 12px', background:'var(--surface2)', borderRadius:6, border:'1px solid var(--border)' }}>
          💡 Sweeps = aggressive, multi-exchange fills
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12, marginBottom:24 }}>
        {summaryCards.map(s => (
          <div key={s.l} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'18px 20px' }}>
            <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'0.06em', marginBottom:8 }}>{s.icon} {s.l}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Flow table */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr>
                {['SYM','TYPE','STRIKE','EXPIRY','PREMIUM','TOTAL $','VOL/OI','ORDER','SIGNAL','TIME'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => {
                const typeColor = o.type === 'call' ? 'var(--green)' : 'var(--red)'
                const sentColor = o.sentiment === 'bullish' ? 'var(--green)' : 'var(--red)'
                const voiColor = o.vol_oi > 5 ? 'var(--accent3)' : o.vol_oi > 3 ? 'var(--gold)' : 'var(--muted)'
                return (
                  <tr key={i} title={o.note}
                    onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'var(--surface2)')}
                    onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = '')}
                    style={{ cursor:'pointer' }}
                  >
                    <td style={{ ...tdStyle, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13 }}>{o.sym}</td>
                    <td style={{ ...tdStyle, fontWeight:600, color:typeColor }}>{o.type.toUpperCase()}</td>
                    <td style={tdStyle}>${o.strike}</td>
                    <td style={{ ...tdStyle, fontSize:11, color:'var(--muted)' }}>{o.expiry}</td>
                    <td style={{ ...tdStyle, fontWeight:500 }}>${o.premium}</td>
                    <td style={{ ...tdStyle, fontWeight:700, color:sentColor }}>{o.totalPremium}</td>
                    <td style={{ ...tdStyle, color:voiColor, fontWeight:500 }}>{o.vol_oi}x</td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize:10, padding:'2px 7px', borderRadius:4,
                        background: o.orderType === 'sweep' ? 'rgba(200,241,53,0.1)' : 'rgba(124,140,255,0.1)',
                        color: o.orderType === 'sweep' ? 'var(--accent)' : 'var(--accent4)',
                      }}>{o.orderType.toUpperCase()}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize:10, padding:'2px 7px', borderRadius:4,
                        background: o.sentiment === 'bullish' ? 'rgba(61,220,132,0.1)' : 'rgba(255,78,78,0.1)',
                        color: sentColor,
                      }}>{o.sentiment === 'bullish' ? '🟢 BULL' : '🔴 BEAR'}</span>
                    </td>
                    <td style={{ ...tdStyle, fontSize:11, color:'var(--muted)' }}>
                      {o.time}{o.unusual && <span style={{ color:'var(--accent3)', marginLeft:4 }}>⚠</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop:12, fontSize:11, color:'var(--muted)', lineHeight:1.7 }}>
        💡 Hover over a row to see trade notes. Options flow data is for educational purposes only.
      </div>
    </div>
  )
}
