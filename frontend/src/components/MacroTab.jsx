import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const MACRO_KPIS = [
  { label:'Fed Funds Rate', val:'5.25–5.50%', sub:'Unchanged · Next: Jun 12', c:'var(--accent3)' },
  { label:'CPI (YoY)', val:'3.4%', sub:'Apr 2024 · Core: 3.6%', c:'var(--gold)' },
  { label:'GDP Growth (Q1)', val:'+1.6%', sub:'Below 2.4% estimate', c:'var(--gold)' },
  { label:'10Y Treasury', val:'4.62%', sub:'↑ +8bps this week', c:'var(--red)' },
  { label:'US Dollar (DXY)', val:'105.2', sub:'Near 6-month high', c:'var(--text)' },
  { label:'WTI Crude Oil', val:'$76.80', sub:'↓ −2.1% this week', c:'var(--muted)' },
  { label:'Gold (XAU/USD)', val:'$2,338', sub:'↓ −0.8% today', c:'var(--gold)' },
  { label:'Unemployment', val:'3.9%', sub:'Apr 2024 · Stable', c:'var(--green)' },
]

const YIELD_DATA = [
  { mat:'1M', current:5.37, yearAgo:4.80 },
  { mat:'3M', current:5.38, yearAgo:5.05 },
  { mat:'6M', current:5.35, yearAgo:5.20 },
  { mat:'1Y', current:5.18, yearAgo:5.10 },
  { mat:'2Y', current:4.88, yearAgo:4.40 },
  { mat:'5Y', current:4.65, yearAgo:3.95 },
  { mat:'10Y', current:4.62, yearAgo:3.85 },
  { mat:'20Y', current:4.80, yearAgo:4.10 },
  { mat:'30Y', current:4.73, yearAgo:3.90 },
]

const FED_DATA = [
  { date:'Mar-20', rate:0.25 }, { date:'Jun-20', rate:0.25 }, { date:'Mar-22', rate:0.5 },
  { date:'May-22', rate:1.0 }, { date:'Jun-22', rate:1.75 }, { date:'Jul-22', rate:2.5 },
  { date:'Sep-22', rate:3.25 }, { date:'Nov-22', rate:4.0 }, { date:'Dec-22', rate:4.5 },
  { date:'Feb-23', rate:4.75 }, { date:'Mar-23', rate:5.0 }, { date:'May-23', rate:5.25 },
  { date:'Jul-23', rate:5.5 }, { date:'Now', rate:5.5 },
]

const FG = 64
const FG_LABEL = FG >= 80 ? 'Extreme Greed' : FG >= 60 ? 'Greed' : FG >= 45 ? 'Neutral' : FG >= 25 ? 'Fear' : 'Extreme Fear'
const FG_COLOR = FG >= 60 ? 'var(--green)' : FG >= 45 ? 'var(--gold)' : 'var(--red)'

const FG_COMPONENTS = [
  { l:'Market Momentum', v:72, c:'var(--green)' },
  { l:'Stock Price Strength', v:68, c:'var(--green)' },
  { l:'Put/Call Ratio', v:58, c:'var(--gold)' },
  { l:'VIX (Inverted)', v:61, c:'var(--green)' },
  { l:'Safe Haven Demand', v:44, c:'var(--gold)' },
]

const CPI = [
  { cat:'Shelter', val:5.5, w:30 },
  { cat:'Energy', val:2.6, w:7 },
  { cat:'Food', val:2.2, w:14 },
  { cat:'Medical Care', val:2.7, w:8 },
  { cat:'Transport', val:10.7, w:6 },
  { cat:'Apparel', val:0.8, w:3 },
]

const GLOBAL = [
  { n:'FTSE 100', v:'8,143', c:'+0.4%', up:true },
  { n:'Nikkei 225', v:'38,487', c:'+1.1%', up:true },
  { n:'DAX', v:'18,092', c:'-0.3%', up:false },
  { n:'Shanghai Comp.', v:'3,104', c:'-0.8%', up:false },
  { n:'CAC 40', v:'7,984', c:'+0.2%', up:true },
  { n:'Hang Seng', v:'18,608', c:'+1.8%', up:true },
  { n:'Bitcoin (BTC)', v:'$67,240', c:'+2.3%', up:true },
  { n:'Ethereum (ETH)', v:'$3,082', c:'+1.7%', up:true },
]

const customTooltipStyle = { background:'#181b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, fontSize:11, color:'#f0f0ee', padding:'8px 12px' }

export default function MacroTab() {
  return (
    <div className="fade-in">
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, letterSpacing:'-0.02em', marginBottom:4 }}>
        Macro Dashboard
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>
        Key economic indicators, Federal Reserve policy, yield curve, and global market context. Updated with latest available data.
      </div>

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:12, marginBottom:24 }}>
        {MACRO_KPIS.map(k => (
          <div key={k.label} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'18px 20px' }}>
            <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'0.06em', marginBottom:8 }}>{k.label}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:k.c }}>{k.val}</div>
            <div style={{ fontSize:11, marginTop:6, color:'var(--muted)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        {/* Yield curve */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:14, marginBottom:4 }}>US Treasury Yield Curve</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:16 }}>Current vs 1 year ago — inversion = recession signal</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={YIELD_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="mat" tick={{ fontSize:10, fill:'#7a7f8e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'#7a7f8e' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} domain={[3.5, 5.6]} />
              <Tooltip contentStyle={customTooltipStyle} formatter={v => `${v}%`} />
              <Legend wrapperStyle={{ fontSize:11, color:'#7a7f8e' }} iconSize={12} />
              <Line type="monotone" dataKey="current" name="Current (May 2024)" stroke="#c8f135" strokeWidth={2.5} dot={{ fill:'#c8f135', r:4 }} />
              <Line type="monotone" dataKey="yearAgo" name="1 Year Ago" stroke="rgba(122,127,142,0.5)" strokeWidth={1.5} dot={{ r:3 }} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Fed rate */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:14, marginBottom:4 }}>Fed Funds Rate History</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:16 }}>FOMC rate decisions since 2020</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={FED_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize:9, fill:'#7a7f8e' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize:10, fill:'#7a7f8e' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={customTooltipStyle} formatter={v => `${v}%`} />
              <Line type="stepAfter" dataKey="rate" name="Fed Funds Rate" stroke="#ff6b4a" strokeWidth={2.5} dot={{ r:3, fill:'#ff6b4a' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom panels */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:24 }}>
        {/* Fear & Greed */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:14 }}>Fear & Greed Index</div>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:52, fontWeight:800, color:FG_COLOR }}>{FG}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:600, color:FG_COLOR }}>{FG_LABEL}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>CNN Fear & Greed Index</div>
          </div>
          <div style={{ position:'relative', height:8, background:'linear-gradient(to right,#ff4e4e,#f0c040,#3ddc84)', borderRadius:4, marginBottom:8 }}>
            <div style={{ position:'absolute', top:-4, left:`${FG}%`, transform:'translateX(-50%)', width:16, height:16, background:'white', borderRadius:'50%', border:'2px solid #0a0b0d' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--muted)' }}>
            <span>Extreme Fear</span><span>Neutral</span><span>Extreme Greed</span>
          </div>
          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:6 }}>
            {FG_COMPONENTS.map(item => (
              <div key={item.l} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ fontSize:10, color:'var(--muted)', width:140, flexShrink:0 }}>{item.l}</div>
                <div style={{ flex:1, height:4, background:'var(--surface2)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${item.v}%`, background:item.c }} />
                </div>
                <div style={{ fontSize:10, fontWeight:500, color:item.c, minWidth:24, textAlign:'right' }}>{item.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CPI Breakdown */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:14 }}>Inflation Breakdown (CPI)</div>
          {CPI.map(c => {
            const hot = c.val > 4, cool = c.val < 2
            const col = hot ? 'var(--red)' : cool ? 'var(--green)' : 'var(--gold)'
            return (
              <div key={c.cat} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                  <span style={{ color:'var(--muted)' }}>{c.cat} <span style={{ fontSize:9 }}>(wt: {c.w}%)</span></span>
                  <span style={{ color:col, fontWeight:500 }}>{c.val > 0 ? '+' : ''}{c.val}%</span>
                </div>
                <div style={{ height:5, background:'var(--surface2)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(c.val / 12 * 100, 100)}%`, background:col, borderRadius:2 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Global Markets */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:14 }}>Global Markets</div>
          {GLOBAL.map(m => (
            <div key={m.n} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{m.n}</div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:12, fontWeight:500 }}>{m.v}</div>
                <div style={{ fontSize:10, color: m.up ? 'var(--green)' : 'var(--red)' }}>{m.c}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Commentary */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, marginBottom:14 }}>AI Macro Commentary</div>
        <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.9 }}>
          The macro backdrop for equities is <strong style={{ color:'var(--text)' }}>cautiously constructive but rate-sensitive</strong>. The Fed's "higher for longer" posture — with rates at 5.25–5.50% — is the dominant headwind, but the market has largely priced this in.<br /><br />
          <strong style={{ color:'var(--text)' }}>The yield curve remains inverted</strong> (2Y at 4.88% vs 10Y at 4.62%), a historically reliable recession predictor. However, the inversion has persisted for 22 months without triggering a recession, suggesting the economy is structurally more resilient than prior cycles.<br /><br />
          <strong style={{ color:'var(--accent)' }}>Key tailwinds:</strong> AI capex supercycle lifting tech earnings, resilient labor market (3.9% unemployment), strong corporate balance sheets, and government fiscal spending. <strong style={{ color:'var(--accent3)' }}>Key risks:</strong> Sticky shelter inflation (5.5% YoY) delaying Fed cuts, $34T federal debt ceiling dynamics, commercial real estate stress, and China slowdown contagion.<br /><br />
          Our AI macro model rates the current environment as <strong style={{ color:'var(--gold)' }}>3.5/5 — Moderately Constructive</strong> for equities, with a preference for quality growth over cyclicals.
        </div>
      </div>
    </div>
  )
}
