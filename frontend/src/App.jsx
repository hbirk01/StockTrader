import React, { useState, useEffect } from 'react'
import { useStocks, useCrypto } from './hooks/useStocks'
import { TickerTape, Header } from './components/Header'
import StocksTab from './components/StocksTab'
import PortfolioTab from './components/PortfolioTab'
import PoliticiansTab from './components/PoliticiansTab'
import NewsTab from './components/NewsTab'
import AIPicksTab from './components/AIPicksTab'
import MyPortfolioTab from './components/MyPortfolioTab'
import ScreenerTab from './components/ScreenerTab'
import HeatmapTab from './components/HeatmapTab'
import EarningsTab from './components/EarningsTab'
import OptionsTab from './components/OptionsTab'
import MacroTab from './components/MacroTab'
import WatchlistTab from './components/WatchlistTab'
import AIAnalystTab from './components/AIAnalystTab'
import { Spinner } from './components/ui'

const TABS = [
  { id: 'stocks',      label: 'All Stocks' },
  { id: 'portfolio',   label: "Claude's Portfolio" },
  { id: 'politicians', label: '🏛 Politicians' },
  { id: 'ai-picks',    label: 'AI Picks' },
  { id: 'news',        label: 'Market News' },
  { id: 'my-portfolio',label: 'My Portfolio' },
  { id: 'screener',    label: 'Screener' },
  { id: 'heatmap',     label: 'Heatmap' },
  { id: 'earnings',    label: 'Earnings' },
  { id: 'options',     label: 'Options Flow' },
  { id: 'macro',       label: 'Macro' },
  { id: 'watchlist',   label: '⭐ Watchlist' },
  { id: 'ai-analyst',  label: 'AI Analyst' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('stocks')
  const { stocks, lastUpdated, loading, error, status, triggerRefresh } = useStocks(60000)
  const crypto = useCrypto()

  // News sentiment map: { SYM: 'bullish' | 'bearish' | 'neutral' }
  const [newsSentiment, setNewsSentiment] = useState({})
  const [newsArticles,  setNewsArticles]  = useState([])
  useEffect(() => {
    if (!stocks.length) return
    const syms = stocks.map(s => s.sym).join(',')
    fetch(`/api/news?symbols=${syms}&limit=50`)
      .then(r => r.json())
      .then(articles => {
        if (!Array.isArray(articles)) return
        setNewsArticles(articles)
        // Aggregate per-stock sentiment
        const counts = {}
        articles.forEach(a => {
          (a.symbols || []).forEach(sym => {
            if (!counts[sym]) counts[sym] = { bullish: 0, bearish: 0, neutral: 0 }
            counts[sym][a.sentiment] = (counts[sym][a.sentiment] || 0) + 1
          })
        })
        const map = {}
        Object.entries(counts).forEach(([sym, c]) => {
          map[sym] = c.bullish > c.bearish ? 'bullish' : c.bearish > c.bullish ? 'bearish' : 'neutral'
        })
        setNewsSentiment(map)
      })
      .catch(() => {})
  }, [stocks.length])

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
            Fetching live prices...
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px', background: 'rgba(255,107,74,0.1)',
            border: '1px solid rgba(255,107,74,0.3)', borderRadius: 8,
            color: 'var(--accent3)', fontSize: 12, marginBottom: 16,
          }}>
            ⚠ API error: {error} — check your API keys in .env
          </div>
        )}

        {!loading && activeTab === 'stocks'       && <StocksTab stocks={stocks} newsSentiment={newsSentiment} />}
        {           activeTab === 'portfolio'     && <PortfolioTab stocks={stocks} />}
        {           activeTab === 'politicians'   && <PoliticiansTab stocks={stocks} />}
        {           activeTab === 'ai-picks'      && <AIPicksTab stocks={stocks} />}
        {           activeTab === 'news'          && <NewsTab articles={newsArticles} />}
        {           activeTab === 'my-portfolio'  && <MyPortfolioTab stocks={stocks} />}
        {           activeTab === 'screener'      && <ScreenerTab stocks={stocks} />}
        {           activeTab === 'heatmap'       && <HeatmapTab stocks={stocks} />}
        {           activeTab === 'earnings'      && <EarningsTab />}
        {           activeTab === 'options'       && <OptionsTab />}
        {           activeTab === 'macro'         && <MacroTab />}
        {           activeTab === 'watchlist'     && <WatchlistTab stocks={stocks} />}
        {           activeTab === 'ai-analyst'    && <AIAnalystTab stocks={stocks} />}
      </main>
    </div>
  )
}
