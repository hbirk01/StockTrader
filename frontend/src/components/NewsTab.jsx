import React, { useState, useMemo } from 'react'

const NEWS = [
  { impact:'bull', icon:'↑', source:'REUTERS', headline:'Nvidia Raises Full-Year Guidance 40% Above Consensus on AI Demand Surge', desc:'Data center segment grew 427% YoY. Blackwell GPU demand exceeds supply through 2026.', time:'2h ago', tickers:['NVDA','AMD'], sentiment:'BULLISH', category:'tech' },
  { impact:'bull', icon:'↑', source:'BLOOMBERG', headline:'Federal Reserve Signals Two Rate Cuts Likely If Inflation Trends Hold', desc:'FOMC minutes reveal growing consensus for easing cycle. Markets price in September as first cut.', time:'4h ago', tickers:['SPY','TLT'], sentiment:'BULLISH', category:'macro' },
  { impact:'bear', icon:'↓', source:'WSJ', headline:'China Manufacturing PMI Falls to 49.1 — Third Consecutive Month of Contraction', desc:'Weak factory output signals slowdown. Companies with China exposure face headwinds.', time:'5h ago', tickers:['AAPL','TSLA'], sentiment:'BEARISH', category:'macro' },
  { impact:'bull', icon:'↑', source:'CNBC', headline:'Meta Q2 Earnings: Revenue +22%, AI Ad Tools Driving Improvements', desc:'AI-enhanced Advantage+ campaigns showing 32% better ROAS. Reels monetization scaling.', time:'Yesterday', tickers:['META'], sentiment:'BULLISH', category:'earnings' },
  { impact:'bear', icon:'↓', source:'TECHCRUNCH', headline:'Intel Delays 18A Node to Late 2025, Customer Orders at Risk', desc:'Third delay for Intel\'s foundry node. TSMC benefits as customers redirect wafer orders.', time:'Yesterday', tickers:['INTC','TSM'], sentiment:'BEARISH', category:'tech' },
  { impact:'bull', icon:'↑', source:'STAT NEWS', headline:'FDA Approves Eli Lilly Donanemab — $15B Alzheimer\'s Opportunity', desc:'Phase 3 trial showed 35% slowing of cognitive decline. First drug to treat early-stage Alzheimer\'s.', time:'2d ago', tickers:['LLY'], sentiment:'BULLISH', category:'earnings' },
  { impact:'neut', icon:'→', source:'FT', headline:'OPEC+ Extends Production Cuts Through Q3, Oil Holds Near $76', desc:'Voluntary cuts extended but compliance uneven. Natural gas prices diverging.', time:'2d ago', tickers:['XOM','CVX'], sentiment:'NEUTRAL', category:'energy' },
  { impact:'bull', icon:'↑', source:'REUTERS', headline:'Amazon AWS Revenue Accelerates to +17% YoY, AI Workloads Key Driver', desc:'AWS operating income $9.4B — highest margin ever. Bedrock and SageMaker enterprise adoption surging.', time:'3d ago', tickers:['AMZN'], sentiment:'BULLISH', category:'earnings' },
  { impact:'bear', icon:'↓', source:'BLOOMBERG', headline:'Commercial Real Estate Stress Spreads to Regional Banks, $500B Exposure', desc:'Office vacancy rates at 40-year highs. NYCB and others flagging credit quality concerns.', time:'3d ago', tickers:['JPM','GS'], sentiment:'BEARISH', category:'macro' },
  { impact:'bull', icon:'↑', source:'CNBC', headline:'Apple Intelligence Features Drive First Major iPhone Upgrade Cycle Since 2021', desc:'Analyst surveys show 40% of iPhone users plan to upgrade within 12 months for AI features.', time:'4d ago', tickers:['AAPL','AVGO','TSM'], sentiment:'BULLISH', category:'tech' },
]

const SECTOR_SENTIMENT = [
  { name:'Technology', score:72 },
  { name:'Healthcare', score:65 },
  { name:'Financials', score:58 },
  { name:'Consumer', score:44 },
  { name:'Energy', score:35 },
  { name:'Industrials', score:51 },
]

const UPCOMING_EVENTS = [
  { date:'Thu May 29', event:'FOMC Meeting Minutes' },
  { date:'Fri May 30', event:'PCE Inflation Data' },
  { date:'Mon Jun 2', event:'ISM Manufacturing PMI' },
  { date:'Wed Jun 4', event:'ADP Jobs Report' },
  { date:'Fri Jun 7', event:'Non-Farm Payrolls' },
]

function NewsCard({ n }) {
  const impactBg = n.impact === 'bull' ? 'rgba(61,220,132,0.15)' : n.impact === 'bear' ? 'rgba(255,78,78,0.15)' : 'rgba(122,127,142,0.15)'
  const impactColor = n.impact === 'bull' ? 'var(--green)' : n.impact === 'bear' ? 'var(--red)' : 'var(--muted)'
  const sentBg = n.sentiment === 'BULLISH' ? 'rgba(61,220,132,0.12)' : n.sentiment === 'BEARISH' ? 'rgba(255,78,78,0.12)' : 'rgba(122,127,142,0.12)'
  const sentColor = n.sentiment === 'BULLISH' ? 'var(--green)' : n.sentiment === 'BEARISH' ? 'var(--red)' : 'var(--muted)'
  return (
    <div
      style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'18px 20px', marginBottom:12, display:'flex', gap:16, alignItems:'flex-start', transition:'all 0.2s', cursor:'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
    >
      <div style={{ width:38, height:38, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, background:impactBg, color:impactColor }}>{n.icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'0.06em', marginBottom:5 }}>{n.source}{n.time && ` · ${n.time}`}</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600, lineHeight:1.4, marginBottom:6 }}>{n.headline}</div>
        {n.desc && <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.6 }}>{n.desc}</div>}
        <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:10 }}>
          <div style={{ display:'flex', gap:6 }}>
            {n.tickers.map(t => (
              <span key={t} style={{ fontSize:10, padding:'2px 8px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:4, color:'var(--accent)' }}>{t}</span>
            ))}
          </div>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, fontWeight:500, letterSpacing:'0.06em', background:sentBg, color:sentColor }}>{n.sentiment}</span>
        </div>
      </div>
    </div>
  )
}

export default function NewsTab() {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return NEWS
    return NEWS.filter(n => n.category === filter)
  }, [filter])

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'tech', label: 'Tech' },
    { id: 'macro', label: 'Macro' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'energy', label: 'Energy' },
  ]

  return (
    <div className="fade-in">
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, letterSpacing:'-0.02em', marginBottom:4 }}>
        Market News & Events
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:20 }}>
        Real-world events ranked by market impact. AI sentiment analysis applied to each story.
      </div>

      <div style={{ display:'flex', gap:16 }}>
        <div style={{ flex:1 }}>
          {/* Filter tags */}
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {filters.map(f => (
              <div
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  fontSize:10, padding:'5px 14px', borderRadius:20, cursor:'pointer',
                  border: filter === f.id ? '1px solid rgba(200,241,53,0.3)' : '1px solid var(--border2)',
                  color: filter === f.id ? 'var(--accent)' : 'var(--muted)',
                  background: filter === f.id ? 'rgba(200,241,53,0.08)' : 'transparent',
                }}
              >{f.label}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding:24, textAlign:'center', color:'var(--muted)', fontSize:12 }}>No articles match this filter.</div>
          ) : (
            filtered.map((n, i) => <NewsCard key={i} n={n} />)
          )}
        </div>

        {/* Sidebar */}
        <div style={{ width:280, flexShrink:0 }}>
          {/* Sector Sentiment */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20, marginBottom:16 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:14 }}>Sector Sentiment</div>
            {SECTOR_SENTIMENT.map(s => {
              const c = s.score > 60 ? 'var(--green)' : s.score < 45 ? 'var(--red)' : 'var(--gold)'
              return (
                <div key={s.name} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                    <span style={{ color:'var(--muted)' }}>{s.name}</span>
                    <span style={{ color:c }}>{s.score}</span>
                  </div>
                  <div style={{ height:4, background:'var(--surface2)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${s.score}%`, background:c, borderRadius:2 }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Upcoming Events */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:14 }}>Upcoming Events</div>
            {UPCOMING_EVENTS.map((e, i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'center', marginBottom:10, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:10, color:'var(--accent)', whiteSpace:'nowrap', fontWeight:500 }}>{e.date}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>{e.event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
