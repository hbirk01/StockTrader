import React from 'react'
import { formatPrice } from './ui'

export function TickerTape({ stocks }) {
  if (!stocks.length) return null
  const items = stocks.map(s => {
    const up = s.chg >= 0
    return (
      <span key={s.sym} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '0.05em' }}>
        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{s.sym}</span>
        <span>{formatPrice(s.price)}</span>
        <span style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
          {up ? '+' : ''}{(s.chg || 0).toFixed(2)}%
        </span>
      </span>
    )
  })

  return (
    <div style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden',
      height: 32,
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{
        background: 'var(--accent)',
        color: '#0a0b0d',
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: '0.1em',
        padding: '0 12px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        LIVE
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          display: 'flex',
          gap: 40,
          whiteSpace: 'nowrap',
          animation: 'scroll-ticker 50s linear infinite',
        }}>
          {items}{items}
        </div>
      </div>
    </div>
  )
}

export function Header({ status, lastUpdated, onRefresh }) {
  const isLive = status?.prices_cached > 0
  const t = lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: 60,
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
    }}>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: 20,
        letterSpacing: '-0.02em',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 8, height: 8,
          background: 'var(--accent)',
          borderRadius: '50%',
          animation: 'pulse-dot 2s ease-in-out infinite',
        }} />
        PulseStock
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isLive ? 'var(--green)' : 'var(--muted)',
            animation: isLive ? 'pulse-dot 2s ease-in-out infinite' : 'none',
          }} />
          {isLive ? 'Live' : 'Loading'}
          {t && <span style={{ opacity: 0.6 }}>· {t}</span>}
        </div>

        {status && (
          <div style={{
            fontSize: 11,
            color: isLive ? 'var(--green)' : 'var(--muted)',
            padding: '4px 12px',
            background: isLive ? 'rgba(61,220,132,0.1)' : 'var(--surface2)',
            border: `1px solid ${isLive ? 'rgba(61,220,132,0.3)' : 'var(--border)'}`,
            borderRadius: 20,
          }}>
            {status.prices_cached}/{status.total_symbols} prices · Finnhub
          </div>
        )}

        <button
          onClick={onRefresh}
          style={{
            background: 'transparent',
            border: '1px solid var(--border2)',
            color: 'var(--muted)',
            fontSize: 11,
            padding: '6px 14px',
            borderRadius: 6,
          }}
        >
          ↻ Refresh
        </button>

        <div style={{
          background: 'linear-gradient(135deg, #c8f135 0%, #4af0b0 100%)',
          color: '#0a0b0d',
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 10,
          padding: '4px 10px',
          borderRadius: 20,
          letterSpacing: '0.08em',
        }}>
          AI POWERED
        </div>
      </div>
    </header>
  )
}
