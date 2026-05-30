import React, { useState } from 'react'
import { useStocks, useCrypto } from './hooks/useStocks'
import { TickerTape, Header } from './components/Header'
import StocksTab from './components/StocksTab'
import PortfolioTab from './components/PortfolioTab'
import { Spinner } from './components/ui'

const TABS = [
  { id: 'stocks',    label: 'All Stocks' },
  { id: 'portfolio', label: "Claude's Portfolio" },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('stocks')
  const { stocks, lastUpdated, loading, error, status, triggerRefresh } = useStocks(60000)
  const crypto = useCrypto()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <TickerTape stocks={stocks} />
      <Header status={status} lastUpdated={lastUpdated} onRefresh={triggerRefresh} />

      {/* Nav */}
      <nav style={{
        display: 'flex',
        padding: '0 32px',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        gap: 2,
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 18px',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 500,
              fontSize: 12,
              letterSpacing: '0.06em',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </div>
        ))}
      </nav>

      <main style={{ padding: '28px 32px', maxWidth: 1500, margin: '0 auto' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--muted)', fontSize: 12 }}>
            <Spinner size={16} />
            Fetching live prices from Finnhub...
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px', background: 'rgba(255,107,74,0.1)',
            border: '1px solid rgba(255,107,74,0.3)', borderRadius: 8,
            color: 'var(--accent3)', fontSize: 12, marginBottom: 16,
          }}>
            ⚠ API error: {error} — check your Finnhub key in .env
          </div>
        )}

        {!loading && activeTab === 'stocks' && <StocksTab stocks={stocks} />}
        {activeTab === 'portfolio' && <PortfolioTab stocks={stocks} />}
      </main>
    </div>
  )
}
