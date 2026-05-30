import React, { useState, useEffect } from 'react'
import { Stars } from './ui'

const STAR_COLORS = { 5:'var(--accent)', 4:'var(--accent2)', 3:'var(--gold)', 2:'var(--accent3)', 1:'var(--muted)' }

function fmt(n) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
function fmtD(n) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toFixed(2)
}

// ── Setup guide shown when not connected ────────────────────────
function SetupGuide() {
  const [copied, setCopied] = useState(null)

  function copy(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const envBlock = `ROBINHOOD_USERNAME=your@email.com
ROBINHOOD_PASSWORD=your_password
ROBINHOOD_TOTP_SECRET=YOUR_TOTP_SECRET`

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{
        background: 'var(--surface)', border: '1px solid rgba(200,241,53,0.2)',
        borderRadius: 12, padding: 32, marginBottom: 20, textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em', marginBottom: 8 }}>
          Connect Your Robinhood Account
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
          Add your credentials to <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, color: 'var(--accent)' }}>.env</code> to see your live holdings, real P&amp;L, and portfolio value here.
        </div>
      </div>

      {/* Steps */}
      {[
        {
          n: 1,
          title: 'Add your credentials to .env',
          desc: 'Open the .env file in your project root and add these lines. This file is already gitignored — your credentials are never committed.',
          code: envBlock,
          codeKey: 'env',
        },
        {
          n: 2,
          title: 'Get your TOTP secret (for 2FA)',
          desc: "Robinhood requires 2FA. To let the app auto-generate the code, you need the secret key — not the 6-digit code.\n\n1. Go to Robinhood → Account → Security → Two-Factor Authentication\n2. Choose 'Authenticator App'\n3. When the QR code appears, click 'Can't scan?' to reveal the text secret\n4. Copy that secret into ROBINHOOD_TOTP_SECRET in your .env",
          code: null,
          codeKey: null,
        },
        {
          n: 3,
          title: 'Restart the backend',
          desc: 'After saving .env, restart the backend. It will log in to Robinhood automatically on startup.',
          code: 'python backend/main.py',
          codeKey: 'restart',
        },
      ].map(step => (
        <div key={step.n} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 20, marginBottom: 14,
        }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(200,241,53,0.12)', border: '1px solid rgba(200,241,53,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--accent)',
            }}>{step.n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                {step.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {step.desc}
              </div>
              {step.code && (
                <div style={{ position: 'relative', marginTop: 12 }}>
                  <pre style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '12px 14px', fontSize: 11,
                    fontFamily: "'DM Mono',monospace", color: 'var(--text)',
                    overflowX: 'auto', margin: 0, lineHeight: 1.7,
                  }}>{step.code}</pre>
                  <button
                    onClick={() => copy(step.code, step.codeKey)}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'var(--surface)', border: '1px solid var(--border2)',
                      color: copied === step.codeKey ? 'var(--accent)' : 'var(--muted)',
                      fontSize: 10, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                    }}
                  >{copied === step.codeKey ? '✓ Copied' : 'Copy'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      <div style={{ padding: '12px 16px', background: 'rgba(200,241,53,0.05)', border: '1px solid rgba(200,241,53,0.15)', borderRadius: 8, fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>
        🔒 Your credentials are stored only in your local <code style={{ color: 'var(--accent)' }}>.env</code> file and are never sent anywhere except directly to Robinhood's servers.
      </div>
    </div>
  )
}

// ── Connected portfolio view ─────────────────────────────────────
function PortfolioView({ data, stocks }) {
  const totalEquity = data.equity || 0
  const cash = data.cash || 0
  const positions = data.positions || []
  const totalVal = positions.reduce((a, p) => a + (p.equity || 0), 0)

  const stats = [
    { label: 'ACCOUNT VALUE', val: `$${fmt(totalEquity)}`, color: 'var(--accent)' },
    { label: 'INVESTED', val: `$${fmt(totalVal)}`, color: 'var(--text)' },
    { label: 'CASH', val: `$${fmt(cash)}`, color: 'var(--text)' },
    { label: 'POSITIONS', val: `${positions.length} stocks`, color: 'var(--text)' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--accent)', border: '1px solid rgba(200,241,53,0.3)', padding: '3px 10px', borderRadius: 20, marginBottom: 8, letterSpacing: '0.08em' }}>
            ◈ ROBINHOOD · {data.username}
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24 }}>My Portfolio</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            Live data from Robinhood{data.stale ? ' — cached (reconnecting...)' : ''}
          </div>
        </div>
        {data.stale && (
          <div style={{ fontSize: 11, color: 'var(--gold)', padding: '6px 12px', background: 'rgba(240,192,64,0.1)', border: '1px solid rgba(240,192,64,0.2)', borderRadius: 6 }}>
            ⚠ Using cached data
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Holdings table */}
      {positions.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
          No open positions found in your Robinhood account.
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['SYMBOL', 'SHARES', 'AVG COST', 'CURRENT', 'EQUITY', 'P&L', 'WEIGHT', 'AI RATING'].map(h => (
                    <th key={h} style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontWeight: 400, background: 'var(--surface2)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(pos => {
                  const up = (pos.pnl || 0) >= 0
                  const weight = totalEquity > 0 ? ((pos.equity / totalEquity) * 100).toFixed(1) : '0'
                  const aiStock = stocks.find(s => s.sym === pos.sym)
                  return (
                    <tr key={pos.sym}
                      onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'var(--surface2)')}
                      onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = '')}
                    >
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>{pos.sym}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{pos.name}</div>
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>{fmtD(pos.shares)}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>${fmtD(pos.avgCost)}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>${fmtD(pos.price)}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 500 }}>${fmt(pos.equity)}</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, color: up ? 'var(--green)' : 'var(--red)' }}>
                        {up ? '+' : '-'}${fmt(Math.abs(pos.pnl))} ({up ? '+' : ''}{fmtD(pos.pnlPct)}%)
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, marginBottom: 4 }}>{weight}%</div>
                        <div style={{ width: 80, height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(weight, 100)}%`, background: up ? 'var(--green)' : 'var(--red)', borderRadius: 2 }} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                        {aiStock ? (
                          <Stars n={aiStock.stars} />
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────
export default function MyPortfolioTab({ stocks }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/robinhood')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  return (
    <div className="fade-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 4 }}>
        My Portfolio
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>
        Your real Robinhood holdings with live prices and AI ratings.
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 12, padding: 24 }}>
          <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Connecting to Robinhood...
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,107,74,0.1)', border: '1px solid rgba(255,107,74,0.3)', borderRadius: 8, color: 'var(--accent3)', fontSize: 12, marginBottom: 20 }}>
          ⚠ Could not reach backend: {error}
        </div>
      )}

      {!loading && data && !data.connected && <SetupGuide />}
      {!loading && data && data.connected && <PortfolioView data={data} stocks={stocks} />}
    </div>
  )
}
