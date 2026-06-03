import React, { useState, useEffect } from 'react'
import { Stars, formatPrice } from './ui'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts'

const STORAGE_KEY = 'claude-portfolio-v4'
const API_URL     = '/api/portfolio'

// ── Persistence ──────────────────────────────────────────────────

function freshPortfolio() {
  const today = new Date().toISOString().slice(0, 10)
  return { startDate: today, cash: 10000, holdings: {}, trades: [], history: [{ date: today, value: 10000 }], lastRebalance: null }
}
function loadFromLocal() {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r) } catch {}
  return null
}
function saveToLocal(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch {}
}
async function loadFromServer() {
  try {
    const res = await fetch(API_URL)
    if (!res.ok) return null
    const data = await res.json()
    if (!data || !data.startDate) return null
    return data
  } catch { return null }
}
async function saveToServer(p) {
  try { await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }) } catch {}
}
function savePortfolio(p) { saveToLocal(p); saveToServer(p) }

// ── Portfolio logic ───────────────────────────────────────────────

function calcValue(p, stocks) {
  let val = p.cash
  Object.entries(p.holdings).forEach(([sym, h]) => {
    const s = stocks.find(x => x.sym === sym)
    if (s?.price) val += h.shares * s.price
  })
  return val
}

function runRebalance(p, stocks) {
  const today = new Date().toISOString().slice(0, 10)
  if (p.lastRebalance === today) return p
  const totalVal = calcValue(p, stocks)
  const newTrades = []
  const fiveStars  = stocks.filter(s => s.stars === 5).slice(0, 5)
  const fourStars  = stocks.filter(s => s.stars === 4).slice(0, 5)
  const threeStars = stocks.filter(s => s.stars === 3).slice(0, 2)
  const targets = {}
  fiveStars.forEach(s  => { targets[s.sym] = 0.16 })
  fourStars.forEach(s  => { targets[s.sym] = 0.07 })
  threeStars.forEach(s => { targets[s.sym] = 0.02 })
  const tSum = Object.values(targets).reduce((a, b) => a + b, 0)
  const scale = 0.95 / tSum
  Object.keys(targets).forEach(k => { targets[k] = parseFloat((targets[k] * scale).toFixed(4)) })
  Object.entries(p.holdings).forEach(([sym, h]) => {
    const stock = stocks.find(x => x.sym === sym)
    if (!stock?.price) return
    const price = stock.price
    const currentAlloc = (h.shares * price) / totalVal
    const targetAlloc = targets[sym] || 0
    if (targetAlloc === 0) {
      p.cash += h.shares * price
      newTrades.push({ date: today, action: 'SELL', sym, shares: h.shares, price, reason: `Downgraded (${stock.stars}★) — full exit` })
      delete p.holdings[sym]
    } else if (currentAlloc > targetAlloc + 0.04) {
      const targetShares = Math.floor((targetAlloc * totalVal) / price)
      const toSell = h.shares - targetShares
      if (toSell > 0) {
        p.cash += toSell * price
        h.shares = targetShares
        newTrades.push({ date: today, action: 'SELL', sym, shares: toSell, price, reason: `Trimming to ${(targetAlloc * 100).toFixed(0)}% target` })
      }
    }
  })
  Object.entries(targets).forEach(([sym, alloc]) => {
    const stock = stocks.find(x => x.sym === sym)
    if (!stock?.price) return
    const price = stock.price
    const targetVal = alloc * totalVal
    const currentVal = (p.holdings[sym]?.shares || 0) * price
    const needed = targetVal - currentVal
    if (needed > price * 0.5 && p.cash >= price) {
      const sharesToBuy = Math.floor(Math.min(needed, p.cash * 0.95) / price)
      if (sharesToBuy < 1) return
      const cost = sharesToBuy * price
      p.cash -= cost
      if (!p.holdings[sym]) p.holdings[sym] = { shares: 0, avgCost: price }
      const h = p.holdings[sym]
      h.avgCost = ((h.avgCost * h.shares) + cost) / (h.shares + sharesToBuy)
      h.shares += sharesToBuy
      newTrades.push({ date: today, action: 'BUY', sym, shares: sharesToBuy, price, reason: `${stock.stars}★ — targeting ${(alloc * 100).toFixed(0)}% allocation` })
    }
  })
  if (newTrades.length === 0)
    newTrades.push({ date: today, action: 'HOLD', sym: 'ALL', shares: 0, price: 0, reason: 'Portfolio balanced — no significant drift from targets' })
  p.trades.unshift(...newTrades)
  p.lastRebalance = today
  const newVal = calcValue(p, stocks)
  const last = p.history[p.history.length - 1]
  if (!last || last.date !== today) p.history.push({ date: today, value: parseFloat(newVal.toFixed(2)) })
  else last.value = parseFloat(newVal.toFixed(2))
  return { ...p }
}

// ── Helpers ───────────────────────────────────────────────────────

function fmt(n) {
  return Number(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
function shortDate(iso) {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${m}/${d}`
}

const ACTION = {
  BUY:  { label: 'BUY',  bg: 'rgba(61,220,132,0.15)',  border: 'rgba(61,220,132,0.35)',  color: 'var(--green)' },
  SELL: { label: 'SELL', bg: 'rgba(255,78,78,0.15)',   border: 'rgba(255,78,78,0.35)',   color: 'var(--red)'   },
  HOLD: { label: 'HOLD', bg: 'rgba(240,192,64,0.15)',  border: 'rgba(240,192,64,0.35)',  color: 'var(--gold)'  },
}

// ── Custom tooltip for chart ──────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  const diff = val - 10000
  const up = diff >= 0
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>${fmt(val)}</div>
      <div style={{ fontSize: 11, color: up ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
        {up ? '+' : ''}${fmt(diff)} ({up ? '+' : ''}{((diff / 10000) * 100).toFixed(2)}%)
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────

export default function PortfolioTab({ stocks }) {
  const [portfolio, setPortfolio] = useState(() => loadFromLocal() || freshPortfolio())
  const [serverLoaded, setServerLoaded] = useState(false)

  useEffect(() => {
    loadFromServer().then(serverData => {
      if (serverData) { saveToLocal(serverData); setPortfolio(serverData) }
      setServerLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!serverLoaded || !stocks.length || !stocks.some(s => s.price)) return
    const updated = runRebalance({ ...portfolio }, stocks)
    if (updated.lastRebalance !== portfolio.lastRebalance || updated.trades.length !== portfolio.trades.length) {
      savePortfolio(updated); setPortfolio(updated)
    }
  }, [stocks, serverLoaded])

  const totalVal = calcValue(portfolio, stocks)
  const gain     = totalVal - 10000
  const gainPct  = ((gain / 10000) * 100).toFixed(2)
  const isUp     = gain >= 0
  const today    = new Date().toISOString().slice(0, 10)

  // Chart data — tight Y domain so changes are visible
  const chartData = portfolio.history.map(h => ({ date: shortDate(h.date), value: h.value }))
  const currentPoint = { date: shortDate(today), value: parseFloat(totalVal.toFixed(2)) }
  if (!chartData.length || chartData[chartData.length - 1].date !== currentPoint.date) chartData.push(currentPoint)
  else chartData[chartData.length - 1] = currentPoint

  const allVals  = chartData.map(d => d.value)
  const minV     = Math.min(...allVals, 10000)
  const maxV     = Math.max(...allVals, 10000)
  const pad      = Math.max((maxV - minV) * 0.25, 300)
  const yMin     = Math.floor((minV - pad) / 200) * 200
  const yMax     = Math.ceil((maxV + pad)  / 200) * 200
  const lineColor = isUp ? '#3ddc84' : '#ff4e4e'

  // Group trades by date for the log
  const tradeGroups = []
  let lastDate = null
  portfolio.trades.slice(0, 40).forEach(t => {
    if (t.date !== lastDate) { tradeGroups.push({ date: t.date, trades: [] }); lastDate = t.date }
    tradeGroups[tradeGroups.length - 1].trades.push(t)
  })

  return (
    <div className="fade-in">

      {/* ── Hero ── */}
      <div style={{ background:'var(--surface)', border:'1px solid rgba(200,241,53,0.2)', borderRadius:14, padding:28, marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:10, color:'var(--accent)', border:'1px solid rgba(200,241,53,0.3)', padding:'3px 10px', borderRadius:20, marginBottom:10, letterSpacing:'0.08em' }}>
              ◈ CLAUDE AI PORTFOLIO
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, letterSpacing:'-0.02em', marginBottom:6 }}>
              Claude's $10,000 Challenge
            </div>
            <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>
              Started {new Date(portfolio.startDate + 'T12:00:00').toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}.
              Rebalances <strong style={{ color:'var(--accent)' }}>automatically</strong> each day based on AI star ratings.
            </div>
          </div>
          <div style={{
            fontSize:12, padding:'10px 18px', borderRadius:10, textAlign:'right',
            background: portfolio.lastRebalance === today ? 'rgba(61,220,132,0.08)' : 'var(--surface2)',
            border: `1px solid ${portfolio.lastRebalance === today ? 'rgba(61,220,132,0.3)' : 'var(--border)'}`,
            color: portfolio.lastRebalance === today ? 'var(--green)' : 'var(--muted)',
          }}>
            {portfolio.lastRebalance === today
              ? <>✅ Rebalanced today<br/><span style={{ fontSize:10 }}>{portfolio.trades.filter(t => t.date === today).length} actions taken</span></>
              : '⏳ Waiting for prices…'}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
          {[
            { label:'PORTFOLIO VALUE', val:`$${fmt(totalVal)}`,                                          color: isUp ? 'var(--green)' : 'var(--red)' },
            { label:'TOTAL RETURN',    val:`${isUp?'+':''}${gainPct}%`,                                  color: isUp ? 'var(--green)' : 'var(--red)' },
            { label:'TOTAL P&L',       val:`${isUp?'+$':'-$'}${fmt(Math.abs(gain))}`,                    color: isUp ? 'var(--green)' : 'var(--red)' },
            { label:'CASH',            val:`$${fmt(portfolio.cash)}`,                                    color:'var(--text)' },
            { label:'POSITIONS',       val:`${Object.keys(portfolio.holdings).length} stocks`,           color:'var(--text)' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--surface2)', borderRadius:10, padding:'16px 18px', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'0.07em', marginBottom:8 }}>{s.label}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Equity chart (full width) ── */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'22px 24px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16 }}>Equity Curve</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>Daily portfolio value vs $10,000 starting capital</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color: isUp ? 'var(--green)' : 'var(--red)' }}>
              {isUp ? '+' : ''}${fmt(Math.abs(gain))}
            </div>
            <div style={{ fontSize:11, color: isUp ? 'var(--green)' : 'var(--red)' }}>
              {isUp ? '+' : ''}{gainPct}% total return
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top:5, right:8, bottom:0, left:0 }}>
            <defs>
              <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={lineColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize:11, fill:'var(--muted)' }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize:11, fill:'var(--muted)' }}
              axisLine={false} tickLine={false} width={72}
              tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
            />
            <ReferenceLine y={10000} stroke="rgba(122,127,142,0.45)" strokeDasharray="5 4" />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2.5} fill="url(#pgGrad)" dot={false} activeDot={{ r:5, fill:lineColor, strokeWidth:0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Holdings + Trade log side-by-side ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:16, alignItems:'start' }}>

        {/* Holdings table */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16 }}>Current Holdings</div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>{Object.keys(portfolio.holdings).length} positions · ${fmt(totalVal - portfolio.cash)} invested</div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
              <thead>
                <tr style={{ background:'var(--surface2)' }}>
                  {['SYMBOL','SHARES','AVG COST','CURRENT','VALUE','P&L','ALLOC','RATING'].map(h => (
                    <th key={h} style={{ fontSize:10, color:'var(--muted)', letterSpacing:'0.08em', textAlign:'left', padding:'11px 16px', borderBottom:'1px solid var(--border)', fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(portfolio.holdings).length === 0 ? (
                  <tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'var(--muted)', fontSize:13 }}>No holdings yet — waiting for live prices</td></tr>
                ) : Object.entries(portfolio.holdings)
                    .sort(([aS, aH], [bS, bH]) => {
                      const aPrice = stocks.find(s => s.sym === aS)?.price || aH.avgCost
                      const bPrice = stocks.find(s => s.sym === bS)?.price || bH.avgCost
                      return (bH.shares * bPrice) - (aH.shares * aPrice)
                    })
                    .map(([sym, h]) => {
                      const stock   = stocks.find(s => s.sym === sym)
                      const price   = stock?.price || h.avgCost
                      const val     = h.shares * price
                      const pnl     = (price - h.avgCost) * h.shares
                      const pnlPct  = ((price - h.avgCost) / h.avgCost * 100)
                      const alloc   = (val / totalVal * 100)
                      const up      = pnl >= 0
                      return (
                        <tr key={sym}
                          onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'rgba(255,255,255,0.03)')}
                          onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = '')}
                          style={{ borderLeft: `3px solid ${up ? 'var(--green)' : 'var(--red)'}` }}
                        >
                          <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', verticalAlign:'middle' }}>
                            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16 }}>{sym}</div>
                            <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{stock?.name || ''}</div>
                          </td>
                          <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontSize:14, fontWeight:500 }}>{h.shares}</td>
                          <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontSize:13, color:'var(--muted)' }}>${h.avgCost.toFixed(2)}</td>
                          <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontSize:14, fontWeight:600, color: stock?.chg > 0 ? 'var(--green)' : stock?.chg < 0 ? 'var(--red)' : 'var(--text)' }}>${price.toFixed(2)}</td>
                          <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>
                            ${fmt(val)}
                          </td>
                          <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
                            <div style={{ fontSize:14, fontWeight:700, color: up ? 'var(--green)' : 'var(--red)' }}>
                              {up ? '+' : '-'}${fmt(Math.abs(pnl))}
                            </div>
                            <div style={{ fontSize:11, color: up ? 'var(--green)' : 'var(--red)', marginTop:2, opacity:0.8 }}>
                              {up ? '+' : ''}{pnlPct.toFixed(1)}%
                            </div>
                          </td>
                          <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', minWidth:100 }}>
                            <div style={{ fontSize:12, fontWeight:600, marginBottom:5 }}>{alloc.toFixed(1)}%</div>
                            <div style={{ height:5, background:'var(--surface2)', borderRadius:3, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${Math.min(alloc, 100)}%`, background: up ? 'var(--green)' : 'var(--red)', borderRadius:3 }} />
                            </div>
                          </td>
                          <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
                            <Stars n={stock?.stars || 3} />
                          </td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trade log */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'18px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16 }}>Trade Log</div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>{portfolio.trades.length} total</div>
          </div>
          <div style={{ maxHeight:520, overflowY:'auto' }}>
            {portfolio.trades.length === 0 ? (
              <div style={{ padding:32, textAlign:'center', color:'var(--muted)', fontSize:13 }}>
                No trades yet — waiting for live prices
              </div>
            ) : tradeGroups.map(group => (
              <div key={group.date}>
                {/* Date header */}
                <div style={{ padding:'8px 20px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontSize:10, color:'var(--muted)', letterSpacing:'0.08em', fontWeight:600 }}>
                  {new Date(group.date + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }).toUpperCase()}
                </div>
                {group.trades.map((t, i) => {
                  const a = ACTION[t.action] || ACTION.HOLD
                  return (
                    <div key={i} style={{ display:'flex', gap:12, padding:'12px 20px', borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
                      {/* Action pill */}
                      <div style={{
                        flexShrink:0, padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:700, letterSpacing:'0.06em',
                        background:a.bg, border:`1px solid ${a.border}`, color:a.color, marginTop:1,
                      }}>
                        {a.label}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        {t.sym !== 'ALL' ? (
                          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14 }}>
                            {t.sym}
                            {t.shares > 0 && (
                              <span style={{ fontFamily:'inherit', fontWeight:500, fontSize:12, color:'var(--muted)', marginLeft:6 }}>
                                {t.shares}sh @ ${t.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, color:'var(--muted)' }}>All positions</div>
                        )}
                        <div style={{ fontSize:11, color:'var(--muted)', marginTop:3, lineHeight:1.5 }}>{t.reason}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
