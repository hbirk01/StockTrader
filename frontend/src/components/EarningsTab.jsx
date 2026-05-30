import React, { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts'

const EARNINGS_DATA = [
  {sym:'NVDA',name:'Nvidia',date:'2024-05-22',time:'AMC',quarter:'Q1 FY25',epsEst:5.58,epsWhisper:6.10,epsActual:6.12,revEst:'24.6B',revActual:'26.0B',result:'beat',beatPct:9.7,move:+9.3,guidance:'raised',beatStreak:7,upcoming:false},
  {sym:'MSFT',name:'Microsoft',date:'2024-04-25',time:'AMC',quarter:'Q3 FY24',epsEst:2.83,epsWhisper:2.95,epsActual:2.94,revEst:'60.8B',revActual:'61.9B',result:'beat',beatPct:3.9,move:+2.1,guidance:'raised',beatStreak:12,upcoming:false},
  {sym:'META',name:'Meta Platforms',date:'2024-04-24',time:'AMC',quarter:'Q1 2024',epsEst:4.32,epsWhisper:4.55,epsActual:4.71,revEst:'36.1B',revActual:'36.5B',result:'beat',beatPct:9.0,move:-10.6,guidance:'mixed',beatStreak:4,upcoming:false,note:'Beat EPS but Q2 guidance midpoint missed. Capex increase spooked investors.'},
  {sym:'GOOGL',name:'Alphabet',date:'2024-04-25',time:'AMC',quarter:'Q1 2024',epsEst:1.51,epsWhisper:1.60,epsActual:1.89,revEst:'78.6B',revActual:'80.5B',result:'beat',beatPct:25.2,move:+10.2,guidance:'raised',beatStreak:6,upcoming:false},
  {sym:'AMZN',name:'Amazon',date:'2024-05-02',time:'AMC',quarter:'Q1 2024',epsEst:0.83,epsWhisper:0.91,epsActual:0.98,revEst:'142.5B',revActual:'143.3B',result:'beat',beatPct:18.1,move:+3.4,guidance:'raised',beatStreak:8,upcoming:false},
  {sym:'AAPL',name:'Apple',date:'2024-05-02',time:'AMC',quarter:'Q2 FY24',epsEst:1.50,epsWhisper:1.55,epsActual:1.53,revEst:'90.3B',revActual:'90.8B',result:'beat',beatPct:2.0,move:+6.0,guidance:'in-line',beatStreak:9,upcoming:false},
  {sym:'TSLA',name:'Tesla',date:'2024-04-23',time:'AMC',quarter:'Q1 2024',epsEst:0.52,epsWhisper:0.48,epsActual:0.45,revEst:'22.3B',revActual:'21.3B',result:'miss',beatPct:-13.5,move:+12.1,guidance:'positive',beatStreak:0,upcoming:false,note:'Missed badly but stock rallied on robotaxi announcement and new model tease.'},
  {sym:'LLY',name:'Eli Lilly',date:'2024-08-08',time:'BMO',quarter:'Q2 2024',epsEst:2.58,epsWhisper:2.80,epsActual:null,revEst:'9.9B',revActual:null,result:null,move:null,guidance:null,beatStreak:6,upcoming:true},
  {sym:'JPM',name:'JPMorgan',date:'2024-07-12',time:'BMO',quarter:'Q2 2024',epsEst:4.19,epsWhisper:4.35,epsActual:null,revEst:'42.3B',revActual:null,result:null,move:null,guidance:null,beatStreak:5,upcoming:true},
  {sym:'AMD',name:'AMD',date:'2024-07-30',time:'AMC',quarter:'Q2 2024',epsEst:0.68,epsWhisper:0.75,epsActual:null,revEst:'5.7B',revActual:null,result:null,move:null,guidance:null,beatStreak:3,upcoming:true},
  {sym:'COST',name:'Costco',date:'2024-09-26',time:'AMC',quarter:'Q4 FY24',epsEst:5.07,epsWhisper:5.18,epsActual:null,revEst:'79.0B',revActual:null,result:null,move:null,guidance:null,beatStreak:8,upcoming:true},
  {sym:'INTC',name:'Intel',date:'2024-07-25',time:'AMC',quarter:'Q2 2024',epsEst:0.10,epsWhisper:0.08,epsActual:null,revEst:'12.9B',revActual:null,result:null,move:null,guidance:null,beatStreak:0,upcoming:true},
]

const GUIDANCE_MAP = { raised:'🔼 Raised', lowered:'🔽 Lowered', mixed:'↔ Mixed', 'in-line':'→ In-Line', positive:'↑ Positive' }

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

function EarningCard({ e }) {
  const isUpcoming = e.upcoming
  const rc = e.result === 'beat' ? 'var(--green)' : e.result === 'miss' ? 'var(--red)' : 'var(--muted)'
  const streakColor = e.beatStreak >= 5 ? 'var(--accent)' : e.beatStreak >= 3 ? 'var(--gold)' : 'var(--muted)'

  return (
    <div style={{
      background:'var(--surface)', border:`1px solid ${isUpcoming ? 'rgba(200,241,53,0.2)' : 'var(--border)'}`,
      borderRadius:10, padding:18, marginBottom:12,
      borderLeft: isUpcoming ? '3px solid var(--accent)' : '',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18 }}>{e.sym}</span>
            <span style={{
              fontSize:10, padding:'2px 8px', borderRadius:4,
              background: isUpcoming ? 'rgba(200,241,53,0.12)' : e.result === 'beat' ? 'rgba(61,220,132,0.12)' : 'rgba(255,78,78,0.12)',
              color: isUpcoming ? 'var(--accent)' : rc,
              border: isUpcoming ? '1px solid rgba(200,241,53,0.25)' : 'none',
            }}>
              {isUpcoming ? 'UPCOMING' : e.result?.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>
            {e.name} · {e.quarter} · {e.date} ({e.time === 'AMC' ? 'After Close' : 'Before Open'})
          </div>
        </div>

        <div style={{ display:'flex', gap:20, marginLeft:'auto' }}>
          {!isUpcoming && e.move !== null && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'var(--muted)' }}>STOCK MOVE</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color: e.move >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {e.move >= 0 ? '+' : ''}{e.move}%
              </div>
            </div>
          )}
          {e.guidance && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'var(--muted)' }}>GUIDANCE</div>
              <div style={{ fontSize:12, fontWeight:500 }}>{GUIDANCE_MAP[e.guidance] || e.guidance}</div>
            </div>
          )}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:10, color:'var(--muted)' }}>BEAT STREAK</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:streakColor }}>{e.beatStreak}Q</div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10 }}>
        <div style={{ background:'var(--surface2)', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4 }}>EPS ESTIMATE</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16 }}>${e.epsEst}</div>
        </div>
        <div style={{ background:'rgba(200,241,53,0.05)', border:'1px solid rgba(200,241,53,0.15)', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:10, color:'var(--accent)', marginBottom:4 }}>WHISPER NUMBER</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:'var(--accent)' }}>${e.epsWhisper}</div>
        </div>
        {e.epsActual !== null && (
          <div style={{ background:'var(--surface2)', borderRadius:8, padding:10 }}>
            <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4 }}>ACTUAL EPS</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:rc }}>
              ${e.epsActual}
              {e.beatPct !== null && <span style={{ fontSize:11 }}> ({e.beatPct >= 0 ? '+' : ''}{e.beatPct}%)</span>}
            </div>
          </div>
        )}
        <div style={{ background:'var(--surface2)', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4 }}>REV ESTIMATE</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16 }}>${e.revEst}</div>
        </div>
        {e.revActual && (
          <div style={{ background:'var(--surface2)', borderRadius:8, padding:10 }}>
            <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4 }}>ACTUAL REV</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:rc }}>${e.revActual}</div>
          </div>
        )}
      </div>

      {e.note && (
        <div style={{ marginTop:10, fontSize:11, color:'var(--muted)', lineHeight:1.6, borderTop:'1px solid var(--border)', paddingTop:10 }}>
          📝 {e.note}
        </div>
      )}
    </div>
  )
}

export default function EarningsTab() {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return EARNINGS_DATA
    if (filter === 'upcoming') return EARNINGS_DATA.filter(e => e.upcoming)
    if (filter === 'recent') return EARNINGS_DATA.filter(e => !e.upcoming)
    if (filter === 'beat') return EARNINGS_DATA.filter(e => e.result === 'beat')
    if (filter === 'miss') return EARNINGS_DATA.filter(e => e.result === 'miss')
    return EARNINGS_DATA
  }, [filter])

  const upcomingTop = EARNINGS_DATA.filter(e => e.upcoming).slice(0, 4)
  const beats = EARNINGS_DATA.filter(e => !e.upcoming && e.result === 'beat').length
  const misses = EARNINGS_DATA.filter(e => !e.upcoming && e.result === 'miss').length

  const filters = [
    { id:'all', label:'All' },
    { id:'upcoming', label:'Upcoming' },
    { id:'recent', label:'Recent Results' },
    { id:'beat', label:'Beat ✓' },
    { id:'miss', label:'Miss ✗' },
  ]

  return (
    <div className="fade-in">
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, letterSpacing:'-0.02em', marginBottom:4 }}>
        Earnings Calendar
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:20 }}>
        Upcoming and recent earnings reports with AI-estimated whisper numbers, historical beat rates, and expected price moves.
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {filters.map(f => (
          <FiltBtn key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</FiltBtn>
        ))}
      </div>

      {/* Top panels */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:14 }}>Upcoming Releases</div>
          {upcomingTop.map(e => (
            <div key={e.sym} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:'var(--accent)', minWidth:52 }}>{e.sym}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500 }}>{e.name} · {e.quarter}</div>
                <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>{e.date} {e.time === 'AMC' ? 'After Close' : 'Before Open'}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:10, color:'var(--muted)' }}>EPS Est</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:14 }}>${e.epsEst}</div>
              </div>
              <div style={{ textAlign:'right', minWidth:58 }}>
                <div style={{ fontSize:10, color:'var(--accent)', marginBottom:2 }}>Whisper</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:'var(--accent)' }}>${e.epsWhisper}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:14 }}>Beat/Miss Tracker</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={[{name:`Beat (${beats})`,value:beats},{name:`Miss (${misses})`,value:misses}]}
                cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value"
              >
                <Cell fill="#3ddc84" />
                <Cell fill="#ff4e4e" />
              </Pie>
              <Legend iconSize={12} wrapperStyle={{ fontSize:11, color:'#7a7f8e' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main cards */}
      {filtered.map((e, i) => <EarningCard key={`${e.sym}-${i}`} e={e} />)}
    </div>
  )
}
