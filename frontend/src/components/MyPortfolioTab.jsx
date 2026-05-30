import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Stars } from './ui'
import TradeModal from './TradeModal'

function fmt(n) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
function fmtD(n) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toFixed(2)
}
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Setup guide ─────────────────────────────────────────────────
function SetupGuide() {
  const [copied, setCopied] = useState(null)
  function copy(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }
  const envBlock = `ALPACA_API_KEY=PKxxxxxxxxxxxxxxxxxx\nALPACA_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nALPACA_PAPER=true`
  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ background:'var(--surface)', border:'1px solid rgba(200,241,53,0.2)', borderRadius:12, padding:32, marginBottom:20, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>📈</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, letterSpacing:'-0.02em', marginBottom:8 }}>Connect Your Alpaca Account</div>
        <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8 }}>
          Add your API keys to <code style={{ background:'var(--surface2)', padding:'2px 6px', borderRadius:4, color:'var(--accent)' }}>.env</code> to see your live holdings, equity curve, and trade directly from this tab.
          Supports <strong style={{ color:'var(--text)' }}>paper trading</strong> and live accounts.
        </div>
      </div>
      {[
        { n:1, title:'Get your API keys from Alpaca', desc:'1. Go to app.alpaca.markets\n2. Select Paper Trading (or Live Trading) from the left sidebar\n3. Find the API Keys section on the right side\n4. Click "Generate New Keys" — copy both the Key ID and Secret Key', code:null },
        { n:2, title:'Add your keys to .env', desc:'Open the .env file in your project root. Set ALPACA_PAPER=false for a live brokerage account.', code:envBlock, codeKey:'env' },
        { n:3, title:'Restart the backend', desc:'After saving .env, restart the backend. Your portfolio loads automatically.', code:'python backend/main.py', codeKey:'restart' },
      ].map(step => (
        <div key={step.n} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:20, marginBottom:14 }}>
          <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:'rgba(200,241,53,0.12)', border:'1px solid rgba(200,241,53,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:'var(--accent)' }}>{step.n}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:14, marginBottom:6 }}>{step.title}</div>
              <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.8, whiteSpace:'pre-line' }}>{step.desc}</div>
              {step.code && (
                <div style={{ position:'relative', marginTop:12 }}>
                  <pre style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'12px 14px', fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--text)', overflowX:'auto', margin:0, lineHeight:1.7 }}>{step.code}</pre>
                  <button onClick={() => copy(step.code, step.codeKey)} style={{ position:'absolute', top:8, right:8, background:'var(--surface)', border:'1px solid var(--border2)', color:copied===step.codeKey?'var(--accent)':'var(--muted)', fontSize:10, padding:'3px 8px', borderRadius:4, cursor:'pointer' }}>{copied===step.codeKey?'✓ Copied':'Copy'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <div style={{ padding:'12px 16px', background:'rgba(200,241,53,0.05)', border:'1px solid rgba(200,241,53,0.15)', borderRadius:8, fontSize:11, color:'var(--muted)', lineHeight:1.7 }}>
        🔒 Your keys are stored only in your local <code style={{ color:'var(--accent)' }}>.env</code> file and are never sent anywhere except directly to Alpaca's servers.
      </div>
    </div>
  )
}

// ── Equity chart ─────────────────────────────────────────────────
const PERIODS = ['1W', '1M', '3M', '1Y']

function EquityChart() {
  const [period,  setPeriod]  = useState('1M')
  const [points,  setPoints]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/alpaca/history?period=${period}`)
      .then(r => r.json())
      .then(d => { setPoints(d.points || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const first = points.find(p => p.equity > 0)?.equity || 0
  const last  = points.length ? points[points.length - 1].equity : 0
  const gain  = last - first
  const gainPct = first ? ((gain / first) * 100).toFixed(2) : '0.00'
  const up    = gain >= 0
  const color = up ? 'var(--green)' : 'var(--red)'
  const hexColor = up ? '#3ddc84' : '#ff4e4e'

  const tickCount = period === '1W' ? 7 : period === '1M' ? 6 : 6

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:24, marginBottom:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'0.06em', marginBottom:4 }}>PORTFOLIO VALUE</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, color:'var(--text)' }}>
            {last ? `$${fmt(last)}` : '—'}
          </div>
          {first > 0 && (
            <div style={{ fontSize:13, color, marginTop:4 }}>
              {up ? '+' : ''}${fmt(Math.abs(gain))} ({up ? '+' : ''}{gainPct}%) this period
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding:'5px 12px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:600,
              background: period === p ? 'rgba(200,241,53,0.12)' : 'transparent',
              border: `1px solid ${period === p ? 'rgba(200,241,53,0.3)' : 'var(--border2)'}`,
              color: period === p ? 'var(--accent)' : 'var(--muted)',
            }}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:12 }}>Loading chart…</div>
      ) : points.length < 2 ? (
        <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:12 }}>Not enough history yet — place some trades to see your equity curve.</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={points} margin={{ top:5, right:0, bottom:0, left:0 }}>
            <defs>
              <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hexColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={hexColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize:10, fill:'var(--muted)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize:10, fill:'var(--muted)' }}
              axisLine={false} tickLine={false} width={72}
              tickFormatter={v => `$${Number(v).toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }}
              formatter={(v) => [`$${Number(v).toLocaleString(undefined, { minimumFractionDigits:2 })}`, 'Equity']}
              labelStyle={{ color:'var(--muted)', marginBottom:4 }}
            />
            <Area type="monotone" dataKey="equity" stroke={hexColor} strokeWidth={2} fill="url(#eqGrad)" dot={false} activeDot={{ r:4, fill:hexColor }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ── Order history ────────────────────────────────────────────────
function OrderHistory() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/alpaca/orders')
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ fontSize:12, color:'var(--muted)', padding:'12px 0' }}>Loading orders…</div>
  if (!orders.length) return (
    <div style={{ padding:24, textAlign:'center', color:'var(--muted)', fontSize:13, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10 }}>
      No orders yet — place your first trade above.
    </div>
  )

  const statusColor = s => ({
    filled: 'var(--green)', partially_filled: 'var(--gold)', canceled: 'var(--muted)',
    rejected: 'var(--red)', new: 'var(--accent)', pending_new: 'var(--accent)',
  })[s] || 'var(--muted)'

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead>
            <tr>
              {['SYMBOL', 'SIDE', 'SHARES', 'FILL PRICE', 'TYPE', 'STATUS', 'DATE'].map(h => (
                <th key={h} style={{ fontSize:10, color:'var(--muted)', letterSpacing:'0.08em', textAlign:'left', padding:'10px 14px', borderBottom:'1px solid var(--border)', fontWeight:400, background:'var(--surface2)', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}
                onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'var(--surface2)')}
                onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = '')}
              >
                <td style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14 }}>{o.sym}</td>
                <td style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:12, fontWeight:600, color: o.side === 'buy' ? 'var(--green)' : 'var(--red)' }}>
                  {o.side === 'buy' ? '↑ BUY' : '↓ SELL'}
                </td>
                <td style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:13 }}>{fmtD(o.filledQty || o.qty)}</td>
                <td style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:13 }}>{o.filledPrice ? `$${fmtD(o.filledPrice)}` : '—'}</td>
                <td style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:12, color:'var(--muted)', textTransform:'capitalize' }}>{o.type}</td>
                <td style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:11 }}>
                  <span style={{ color: statusColor(o.status), background:`${statusColor(o.status)}18`, border:`1px solid ${statusColor(o.status)}30`, padding:'2px 8px', borderRadius:4, textTransform:'capitalize' }}>{o.status?.replace('_', ' ')}</span>
                </td>
                <td style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:11, color:'var(--muted)' }}>{fmtDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Connected portfolio view ─────────────────────────────────────
function PortfolioView({ data, stocks, onTrade, onRefresh }) {
  const totalEquity = data.equity || 0
  const cash        = data.cash || 0
  const dayPnl      = data.dayPnl || 0
  const positions   = data.positions || []
  const totalVal    = positions.reduce((a, p) => a + (p.equity || 0), 0)

  const stats = [
    { label:'PORTFOLIO VALUE', val:`$${fmt(totalEquity)}`,                                  color:'var(--accent)' },
    { label:'INVESTED',        val:`$${fmt(totalVal)}`,                                     color:'var(--text)' },
    { label:'CASH',            val:`$${fmt(cash)}`,                                         color:'var(--text)' },
    { label:"TODAY'S P&L",     val:`${dayPnl>=0?'+':'-'}$${fmt(Math.abs(dayPnl))}`,        color: dayPnl>=0?'var(--green)':'var(--red)' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:10, color:'var(--accent)', border:'1px solid rgba(200,241,53,0.3)', padding:'3px 10px', borderRadius:20, marginBottom:8, letterSpacing:'0.08em' }}>
            ◈ ALPACA · {data.paper ? 'PAPER' : 'LIVE'}
          </div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24 }}>My Portfolio</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
            Live data from Alpaca{data.paper ? ' (paper trading)' : ''}
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {data.paper && (
            <div style={{ fontSize:11, color:'var(--gold)', padding:'6px 12px', background:'rgba(240,192,64,0.1)', border:'1px solid rgba(240,192,64,0.2)', borderRadius:6 }}>
              📄 Paper
            </div>
          )}
          <button
            onClick={() => onTrade({ symbol: '', side: 'buy' })}
            style={{
              padding:'8px 18px', borderRadius:8, cursor:'pointer',
              fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13,
              background:'rgba(200,241,53,0.12)', border:'1px solid rgba(200,241,53,0.3)',
              color:'var(--accent)',
            }}
          >+ Trade</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12, marginBottom:24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'18px 20px' }}>
            <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'0.06em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Equity chart */}
      <EquityChart />

      {/* Holdings table */}
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, marginBottom:14 }}>Open Positions</div>
      {positions.length === 0 ? (
        <div style={{ padding:32, textAlign:'center', color:'var(--muted)', fontSize:13, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, marginBottom:24 }}>
          No open positions yet.{data.paper ? ' Place some paper trades to see them here.' : ''}
        </div>
      ) : (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', marginBottom:24 }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
              <thead>
                <tr>
                  {['SYMBOL','SHARES','AVG COST','CURRENT','EQUITY','UNREALIZED P&L','WEIGHT','AI RATING',''].map(h => (
                    <th key={h} style={{ fontSize:10, color:'var(--muted)', letterSpacing:'0.08em', textAlign:'left', padding:'10px 14px', borderBottom:'1px solid var(--border)', fontWeight:400, background:'var(--surface2)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(pos => {
                  const up      = (pos.pnl || 0) >= 0
                  const weight  = totalEquity > 0 ? ((pos.equity / totalEquity) * 100).toFixed(1) : '0'
                  const aiStock = stocks.find(s => s.sym === pos.sym)
                  return (
                    <tr key={pos.sym}
                      onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'var(--surface2)')}
                      onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = '')}
                    >
                      <td style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', verticalAlign:'middle' }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15 }}>{pos.sym}</div>
                        <div style={{ fontSize:11, color:'var(--muted)' }}>{pos.name}</div>
                      </td>
                      <td style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontSize:13 }}>{fmtD(pos.shares)}</td>
                      <td style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontSize:13 }}>${fmtD(pos.avgCost)}</td>
                      <td style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontSize:13 }}>${fmtD(pos.price)}</td>
                      <td style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:500 }}>${fmt(pos.equity)}</td>
                      <td style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontSize:13, color: up?'var(--green)':'var(--red)' }}>
                        {up?'+':'-'}${fmt(Math.abs(pos.pnl))} ({up?'+':''}{fmtD(pos.pnlPct)}%)
                      </td>
                      <td style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
                        <div style={{ fontSize:12, marginBottom:4 }}>{weight}%</div>
                        <div style={{ width:80, height:4, background:'var(--surface2)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${Math.min(weight,100)}%`, background:up?'var(--green)':'var(--red)', borderRadius:2 }} />
                        </div>
                      </td>
                      <td style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
                        {aiStock ? <Stars n={aiStock.stars} /> : <span style={{ fontSize:11, color:'var(--muted)' }}>—</span>}
                      </td>
                      <td style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
                        <button
                          onClick={() => onTrade({ symbol: pos.sym, side: 'sell' })}
                          style={{ fontSize:10, padding:'4px 10px', borderRadius:6, cursor:'pointer', background:'rgba(255,78,78,0.1)', border:'1px solid rgba(255,78,78,0.25)', color:'var(--red)' }}
                        >Sell</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order history */}
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, marginBottom:14 }}>Order History</div>
      <OrderHistory />
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────
export default function MyPortfolioTab({ stocks }) {
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [tradeModal, setTradeModal] = useState(null) // { symbol, side } or null

  function fetchPortfolio() {
    setLoading(true)
    fetch('/api/alpaca')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { fetchPortfolio() }, [])

  function openTrade({ symbol, side }) {
    setTradeModal({ symbol, side })
  }

  return (
    <div className="fade-in">
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, letterSpacing:'-0.02em', marginBottom:4 }}>
        My Portfolio
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>
        Your Alpaca holdings with live prices, equity curve, and one-click trading.
      </div>

      {loading && (
        <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--muted)', fontSize:12, padding:24 }}>
          <div style={{ width:16, height:16, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          Connecting to Alpaca…
        </div>
      )}

      {!loading && error && (
        <div style={{ padding:'12px 16px', background:'rgba(255,107,74,0.1)', border:'1px solid rgba(255,107,74,0.3)', borderRadius:8, color:'var(--accent3)', fontSize:12, marginBottom:20 }}>
          ⚠ Could not reach backend: {error}
        </div>
      )}

      {!loading && data && !data.connected && <SetupGuide />}
      {!loading && data && data.connected && (
        <PortfolioView data={data} stocks={stocks} onTrade={openTrade} onRefresh={fetchPortfolio} />
      )}

      {tradeModal && (
        <TradeModal
          initialSymbol={tradeModal.symbol}
          initialSide={tradeModal.side}
          onClose={() => setTradeModal(null)}
          onFilled={() => { setTimeout(fetchPortfolio, 800) }}
        />
      )}
    </div>
  )
}
