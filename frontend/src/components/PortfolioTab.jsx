import React, { useState, useEffect, useCallback } from 'react'
import { Stars, StatCard, Card, formatPrice, formatMktCap } from './ui'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const STORAGE_KEY = 'claude-portfolio-v4'
const API_URL = '/api/portfolio'

function freshPortfolio() {
  const today = new Date().toISOString().slice(0, 10)
  return { startDate: today, cash: 10000, holdings: {}, trades: [], history: [{ date: today, value: 10000 }], lastRebalance: null }
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
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
    // Server returns {} when nothing saved yet
    if (!data || !data.startDate) return null
    return data
  } catch {
    return null
  }
}

async function saveToServer(p) {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
  } catch {}
}

function savePortfolio(p) {
  saveToLocal(p)
  saveToServer(p) // fire-and-forget
}

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

  // Allocation targets by star rating
  const fiveStars = stocks.filter(s => s.stars === 5).slice(0, 5)
  const fourStars  = stocks.filter(s => s.stars === 4).slice(0, 5)
  const threeStars = stocks.filter(s => s.stars === 3).slice(0, 2)

  const targets = {}
  fiveStars.forEach(s  => { targets[s.sym] = 0.16 })
  fourStars.forEach(s  => { targets[s.sym] = 0.07 })
  threeStars.forEach(s => { targets[s.sym] = 0.02 })

  // Normalize to 95% (keep 5% cash)
  const tSum = Object.values(targets).reduce((a, b) => a + b, 0)
  const scale = 0.95 / tSum
  Object.keys(targets).forEach(k => { targets[k] = parseFloat((targets[k] * scale).toFixed(4)) })

  // Sell anything not in targets or overweight
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

  // Buy into targets
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

  if (newTrades.length === 0) {
    newTrades.push({ date: today, action: 'HOLD', sym: 'ALL', shares: 0, price: 0, reason: 'Portfolio balanced — no significant drift from targets' })
  }

  p.trades.unshift(...newTrades)
  p.lastRebalance = today

  const newVal = calcValue(p, stocks)
  const last = p.history[p.history.length - 1]
  if (!last || last.date !== today) {
    p.history.push({ date: today, value: parseFloat(newVal.toFixed(2)) })
  } else {
    last.value = parseFloat(newVal.toFixed(2))
  }

  return { ...p }
}

const TRADE_COLORS = { BUY: 'var(--green)', SELL: 'var(--red)', HOLD: 'var(--gold)' }

export default function PortfolioTab({ stocks }) {
  // Start with local cache immediately (no flicker), then hydrate from server
  const [portfolio, setPortfolio] = useState(() => loadFromLocal() || freshPortfolio())
  const [serverLoaded, setServerLoaded] = useState(false)

  // Hydrate from server on mount — server is the source of truth
  useEffect(() => {
    loadFromServer().then(serverData => {
      if (serverData) {
        saveToLocal(serverData)   // keep local in sync
        setPortfolio(serverData)
      }
      setServerLoaded(true)
    })
  }, [])

  // Auto-rebalance when stocks load and have prices (wait for server data first)
  useEffect(() => {
    if (!serverLoaded) return
    if (!stocks.length || !stocks.some(s => s.price)) return
    const updated = runRebalance({ ...portfolio }, stocks)
    if (updated.lastRebalance !== portfolio.lastRebalance || updated.trades.length !== portfolio.trades.length) {
      savePortfolio(updated)
      setPortfolio(updated)
    }
  }, [stocks, serverLoaded])

  const totalVal = calcValue(portfolio, stocks)
  const gain = totalVal - 10000
  const gainPct = (gain / 100).toFixed(2)
  const today = new Date().toISOString().slice(0, 10)

  const chartData = portfolio.history.map(h => ({ date: h.date, value: h.value, baseline: 10000 }))
  const currentChartPoint = { date: today, value: parseFloat(totalVal.toFixed(2)), baseline: 10000 }
  if (!chartData.length || chartData[chartData.length - 1].date !== today) {
    chartData.push(currentChartPoint)
  } else {
    chartData[chartData.length - 1] = currentChartPoint
  }

  return (
    <div className="fade-in">
      {/* Hero */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid rgba(200,241,53,0.2)',
        borderRadius: 12, padding: 28, marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 10, color: 'var(--accent)',
              border: '1px solid rgba(200,241,53,0.3)', padding: '3px 10px',
              borderRadius: 20, marginBottom: 10, letterSpacing: '0.08em',
            }}>
              ◈ CLAUDE AI PORTFOLIO
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Claude's $10,000 Challenge
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.7 }}>
              Started {new Date(portfolio.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              Trades run <strong style={{ color: 'var(--accent)' }}>automatically</strong> every day based on star ratings and market conditions.
            </div>
          </div>
          <div style={{
            fontSize: 11, color: portfolio.lastRebalance === today ? 'var(--green)' : 'var(--muted)',
            padding: '8px 16px', background: 'var(--surface2)',
            border: `1px solid ${portfolio.lastRebalance === today ? 'rgba(61,220,132,0.3)' : 'var(--border)'}`,
            borderRadius: 8,
          }}>
            {portfolio.lastRebalance === today
              ? `✅ Traded today · ${portfolio.trades.filter(t => t.date === today).length} actions`
              : '⏳ Waiting for prices...'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: 'PORTFOLIO VALUE', val: '$' + totalVal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','), color: totalVal >= 10000 ? 'var(--green)' : 'var(--red)' },
            { label: 'TOTAL RETURN',    val: (gain >= 0 ? '+' : '') + gainPct + '%', color: gain >= 0 ? 'var(--green)' : 'var(--red)' },
            { label: 'TOTAL GAIN/LOSS', val: (gain >= 0 ? '+$' : '-$') + Math.abs(gain).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','), color: gain >= 0 ? 'var(--green)' : 'var(--red)' },
            { label: 'CASH REMAINING',  val: '$' + portfolio.cash.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','), color: 'var(--text)' },
            { label: 'POSITIONS',       val: Object.keys(portfolio.holdings).length + ' stocks', color: 'var(--text)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Equity chart */}
        <Card>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Portfolio Value</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>Equity curve vs $10,000 baseline</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} tickLine={false} tickFormatter={v => '$' + v.toLocaleString()} />
              <Tooltip
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 11 }}
                formatter={v => '$' + Number(v).toLocaleString()}
              />
              <ReferenceLine y={10000} stroke="rgba(122,127,142,0.4)" strokeDasharray="4 3" />
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} dot={false} name="Portfolio" />
              <Line type="monotone" dataKey="baseline" stroke="rgba(122,127,142,0.4)" strokeWidth={1} dot={false} strokeDasharray="4 3" name="Baseline" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Trade log */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 13 }}>Trade Log</span>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{portfolio.trades.length} total</span>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {portfolio.trades.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                No trades yet — waiting for live prices
              </div>
            ) : portfolio.trades.slice(0, 30).map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 12,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: `${TRADE_COLORS[t.action]}22`,
                  color: TRADE_COLORS[t.action],
                }}>
                  {t.action[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>
                    {t.action} {t.sym} {t.shares > 0 ? `${t.shares}sh @ $${t.price.toFixed(2)}` : ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, lineHeight: 1.5 }}>{t.reason}</div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{t.date}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Holdings table */}
      <Card>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
          Current Holdings
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                {['SYMBOL','SHARES','AVG COST','CURRENT','VALUE','P&L','ALLOC','RATING'].map(h => (
                  <th key={h} style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(portfolio.holdings).length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                  No holdings yet
                </td></tr>
              ) : Object.entries(portfolio.holdings).map(([sym, h]) => {
                const stock = stocks.find(s => s.sym === sym)
                const price = stock?.price || h.avgCost
                const val = h.shares * price
                const pnl = (price - h.avgCost) * h.shares
                const pnlPct = ((price - h.avgCost) / h.avgCost * 100).toFixed(1)
                const alloc = (val / totalVal * 100).toFixed(1)
                const up = pnl >= 0
                return (
                  <tr key={sym}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }}>{sym}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{stock?.name}</div>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>{h.shares}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>${h.avgCost.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>${price.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 500 }}>
                      ${val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: up ? 'var(--green)' : 'var(--red)' }}>
                      {up ? '+' : '-'}${Math.abs(pnl).toFixed(0)} ({up ? '+' : ''}{pnlPct}%)
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, marginBottom: 3 }}>{alloc}%</div>
                      <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden', width: 80 }}>
                        <div style={{ height: '100%', width: alloc + '%', background: up ? 'var(--green)' : 'var(--red)', borderRadius: 2 }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                      <Stars n={stock?.stars || 3} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
