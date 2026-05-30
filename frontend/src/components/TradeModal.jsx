import React, { useState, useEffect } from 'react'

export default function TradeModal({ initialSymbol = '', initialSide = 'buy', onClose, onFilled }) {
  const [symbol,     setSymbol]     = useState(initialSymbol.toUpperCase())
  const [side,       setSide]       = useState(initialSide)
  const [qty,        setQty]        = useState('')
  const [orderType,  setOrderType]  = useState('market')
  const [limitPrice, setLimitPrice] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState(null)

  useEffect(() => {
    setSymbol(initialSymbol.toUpperCase())
    setSide(initialSide)
    setResult(null)
    setQty('')
  }, [initialSymbol, initialSide])

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function submit() {
    const parsedQty = parseFloat(qty)
    if (!symbol || !parsedQty || parsedQty <= 0) return
    setLoading(true)
    setResult(null)
    try {
      const body = { symbol, qty: parsedQty, side, type: orderType }
      if (orderType === 'limit' && limitPrice) body.limitPrice = parseFloat(limitPrice)
      const r = await fetch('/api/alpaca/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()
      setResult(data)
      if (data.ok && onFilled) onFilled()
    } catch (e) {
      setResult({ ok: false, error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 8,
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    color: 'var(--text)', fontSize: 14, outline: 'none',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 16, padding: 28, width: 360, maxWidth: '92vw',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18 }}>Place Trade</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
          >×</button>
        </div>

        {/* ── Result screen ── */}
        {result ? (
          <>
            <div style={{
              padding: '24px 20px', borderRadius: 12, textAlign: 'center', marginBottom: 18,
              background: result.ok ? 'rgba(61,220,132,0.08)' : 'rgba(255,78,78,0.08)',
              border: `1px solid ${result.ok ? 'rgba(61,220,132,0.25)' : 'rgba(255,78,78,0.25)'}`,
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{result.ok ? '✅' : '❌'}</div>
              {result.ok ? (
                <>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--green)', marginBottom: 6 }}>
                    Order Placed
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                    {result.side?.toUpperCase()} {result.qty} shares of <strong style={{ color: 'var(--text)' }}>{result.symbol}</strong>
                    <br />Status: <span style={{ color: 'var(--accent)' }}>{result.status}</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--red)', marginBottom: 6 }}>
                    Order Failed
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{result.error}</div>
                </>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => { setResult(null); setQty('') }} style={{
                padding: '10px', borderRadius: 8, cursor: 'pointer',
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                color: 'var(--text)', fontSize: 13,
              }}>Place Another</button>
              <button onClick={onClose} style={{
                padding: '10px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.25)',
                color: 'var(--accent)', fontSize: 13, fontWeight: 600,
              }}>Done</button>
            </div>
          </>
        ) : (
          /* ── Order form ── */
          <>
            {/* Symbol */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>SYMBOL</label>
              <input
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                placeholder="NVDA"
                style={{ ...inp, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}
              />
            </div>

            {/* Buy / Sell */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>SIDE</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['buy', '↑ BUY'], ['sell', '↓ SELL']].map(([s, label]) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    style={{
                      padding: '11px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                      background: side === s ? (s === 'buy' ? 'rgba(61,220,132,0.15)' : 'rgba(255,78,78,0.15)') : 'var(--surface2)',
                      border: `1px solid ${side === s ? (s === 'buy' ? 'rgba(61,220,132,0.45)' : 'rgba(255,78,78,0.45)') : 'var(--border2)'}`,
                      color: side === s ? (s === 'buy' ? 'var(--green)' : 'var(--red)') : 'var(--muted)',
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Shares */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>SHARES</label>
              <input
                type="number" min="0.001" step="any"
                value={qty}
                onChange={e => setQty(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="1"
                style={inp}
              />
            </div>

            {/* Order type */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>ORDER TYPE</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['market', 'limit'].map(t => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    style={{
                      padding: '9px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                      background: orderType === t ? 'rgba(200,241,53,0.1)' : 'var(--surface2)',
                      border: `1px solid ${orderType === t ? 'rgba(200,241,53,0.3)' : 'var(--border2)'}`,
                      color: orderType === t ? 'var(--accent)' : 'var(--muted)',
                    }}
                  >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                ))}
              </div>
              {orderType === 'limit' && (
                <input
                  type="number" min="0" step="0.01"
                  value={limitPrice}
                  onChange={e => setLimitPrice(e.target.value)}
                  placeholder="Limit price ($)"
                  style={{ ...inp, marginTop: 8 }}
                />
              )}
            </div>

            {/* Paper tag */}
            <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginBottom: 14 }}>
              📄 Paper Trading — no real money at risk
            </div>

            {/* Submit */}
            <button
              onClick={submit}
              disabled={loading || !symbol || !qty || parseFloat(qty) <= 0}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, cursor: 'pointer',
                fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.04em',
                transition: 'all 0.15s',
                background: side === 'buy' ? 'rgba(61,220,132,0.18)' : 'rgba(255,78,78,0.18)',
                border: `1px solid ${side === 'buy' ? 'rgba(61,220,132,0.4)' : 'rgba(255,78,78,0.4)'}`,
                color: side === 'buy' ? 'var(--green)' : 'var(--red)',
                opacity: loading || !symbol || !qty ? 0.5 : 1,
              }}
            >
              {loading ? 'Placing…' : `Place ${side === 'buy' ? 'Buy' : 'Sell'} Order`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
