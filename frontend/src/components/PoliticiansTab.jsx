import React, { useState, useMemo } from 'react'
import { Stars } from './ui'

const POL_TRADES = [
  {name:"Nancy Pelosi",chamber:"House",party:"dem",state:"CA",committee:"none",action:"buy",sym:"NVDA",company:"Nvidia Corp",amount:"$1M–$5M",date:"2024-01-12",disclosed:"2024-02-18",lagDays:37,notes:"Call options purchased. Nvidia is a key AI infrastructure supplier to government contracts.",conflict:false},
  {name:"Nancy Pelosi",chamber:"House",party:"dem",state:"CA",committee:"none",action:"buy",sym:"MSFT",company:"Microsoft Corp",amount:"$500K–$1M",date:"2024-02-03",disclosed:"2024-03-10",lagDays:36,notes:"Purchased ahead of major DoD Azure contract announcement.",conflict:false},
  {name:"Tommy Tuberville",chamber:"Senate",party:"rep",state:"AL",committee:"Armed Services",action:"buy",sym:"RTX",company:"Raytheon Technologies",amount:"$50K–$100K",date:"2024-01-08",disclosed:"2024-02-20",lagDays:43,notes:"Armed Services committee member buying major defense contractor.",conflict:true,conflictReason:"Sits on Armed Services Committee; Raytheon is primary DoD supplier"},
  {name:"Dan Crenshaw",chamber:"House",party:"rep",state:"TX",committee:"Intelligence",action:"buy",sym:"PLTR",company:"Palantir Technologies",amount:"$15K–$50K",date:"2024-03-14",disclosed:"2024-04-12",lagDays:29,notes:"Intelligence committee member buys data analytics firm with CIA, NSA contracts.",conflict:true,conflictReason:"Sits on Intelligence Committee; Palantir holds major IC contracts"},
  {name:"Mark Kelly",chamber:"Senate",party:"dem",state:"AZ",committee:"Commerce",action:"buy",sym:"AAPL",company:"Apple Inc",amount:"$100K–$250K",date:"2024-02-20",disclosed:"2024-03-28",lagDays:37,notes:"Routine tech sector purchase.",conflict:false},
  {name:"Ro Khanna",chamber:"House",party:"dem",state:"CA",committee:"none",action:"sell",sym:"TSLA",company:"Tesla Inc",amount:"$250K–$500K",date:"2024-01-22",disclosed:"2024-02-15",lagDays:24,notes:"Sold ahead of weak Q4 earnings miss.",conflict:false},
  {name:"Josh Gottheimer",chamber:"House",party:"dem",state:"NJ",committee:"Intelligence",action:"buy",sym:"GOOGL",company:"Alphabet Inc",amount:"$100K–$250K",date:"2024-03-01",disclosed:"2024-04-02",lagDays:32,notes:"Bought weeks before Gemini Ultra launch announcement.",conflict:false},
  {name:"Michael McCaul",chamber:"House",party:"rep",state:"TX",committee:"Foreign Affairs",action:"buy",sym:"LMT",company:"Lockheed Martin",amount:"$500K–$1M",date:"2024-02-14",disclosed:"2024-03-29",lagDays:44,notes:"Foreign Affairs chair buys defense stock amid Ukraine aid debates.",conflict:true,conflictReason:"Chairs Foreign Affairs Committee which oversees defense exports"},
  {name:"Shelley Moore Capito",chamber:"Senate",party:"rep",state:"WV",committee:"Environment",action:"buy",sym:"XOM",company:"ExxonMobil",amount:"$50K–$100K",date:"2024-01-30",disclosed:"2024-02-28",lagDays:29,notes:"Energy sector purchase by Environment & Public Works committee member.",conflict:true,conflictReason:"Environment Committee regulates oil & gas industry"},
  {name:"Pete Sessions",chamber:"House",party:"rep",state:"TX",committee:"Rules",action:"buy",sym:"AMZN",company:"Amazon.com",amount:"$250K–$500K",date:"2024-03-05",disclosed:"2024-04-08",lagDays:34,notes:"AWS government cloud contracts expanding significantly.",conflict:false},
  {name:"Suzan DelBene",chamber:"House",party:"dem",state:"WA",committee:"Ways & Means",action:"buy",sym:"META",company:"Meta Platforms",amount:"$100K–$250K",date:"2024-02-28",disclosed:"2024-03-30",lagDays:31,notes:"Former Microsoft exec buys Meta as AI advertising tools launch.",conflict:false},
  {name:"Roger Marshall",chamber:"Senate",party:"rep",state:"KS",committee:"Health",action:"buy",sym:"LLY",company:"Eli Lilly",amount:"$500K–$1M",date:"2024-01-15",disclosed:"2024-02-20",lagDays:36,notes:"Health committee senator buys Eli Lilly ahead of Ozempic/GLP-1 Senate hearing.",conflict:true,conflictReason:"Health Committee directly oversees pharmaceutical industry regulations"},
  {name:"Nancy Pelosi",chamber:"House",party:"dem",state:"CA",committee:"none",action:"buy",sym:"AMD",company:"Advanced Micro Devices",amount:"$500K–$1M",date:"2024-03-19",disclosed:"2024-04-15",lagDays:27,notes:"Chips Act beneficiary — Pelosi husband Paul purchased call options.",conflict:false},
  {name:"Marjorie Taylor Greene",chamber:"House",party:"rep",state:"GA",committee:"none",action:"sell",sym:"INTC",company:"Intel Corp",amount:"$15K–$50K",date:"2024-02-12",disclosed:"2024-03-18",lagDays:35,notes:"Sold Intel position during ongoing process node delays.",conflict:false},
  {name:"Eric Swalwell",chamber:"House",party:"dem",state:"CA",committee:"Judiciary",action:"buy",sym:"NVDA",company:"Nvidia Corp",amount:"$15K–$50K",date:"2024-03-08",disclosed:"2024-04-10",lagDays:33,notes:"Silicon Valley district rep adds to Nvidia position.",conflict:false},
]

function initials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('')
}

function FiltBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 11, padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
      border: `1px solid ${active ? 'rgba(200,241,53,0.35)' : 'var(--border)'}`,
      background: active ? 'rgba(200,241,53,0.08)' : 'var(--surface2)',
      color: active ? 'var(--accent)' : 'var(--muted)',
      transition: 'all 0.2s',
    }}>{children}</button>
  )
}

function TradeCard({ t, stockPrice }) {
  const lagColor = t.lagDays <= 14 ? 'var(--green)' : t.lagDays >= 40 ? 'var(--accent3)' : 'var(--muted)'
  const lagBg = t.lagDays <= 14 ? 'rgba(61,220,132,0.1)' : t.lagDays >= 40 ? 'rgba(255,107,74,0.1)' : 'rgba(122,127,142,0.1)'
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
      padding: '16px 18px', marginBottom: 10, transition: 'all 0.2s', cursor: 'pointer',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, flexShrink: 0,
          background: t.party === 'dem' ? 'rgba(100,149,237,0.2)' : 'rgba(255,99,71,0.2)',
          color: t.party === 'dem' ? '#6495ed' : '#ff6347',
        }}>{initials(t.name)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>{t.name}</span>
            {t.conflict && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,107,74,0.1)', color: 'var(--accent3)', border: '1px solid rgba(255,107,74,0.2)' }}>
                ⚠ COMMITTEE CONFLICT
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
            {t.chamber} · {t.party === 'dem' ? 'Democrat' : 'Republican'} · {t.state}
            {t.committee !== 'none' && ` · ${t.committee} Cmte`}
          </div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6, letterSpacing: '0.06em',
          background: t.action === 'buy' ? 'rgba(61,220,132,0.15)' : 'rgba(255,78,78,0.15)',
          color: t.action === 'buy' ? 'var(--green)' : 'var(--red)',
        }}>{t.action === 'buy' ? 'PURCHASE' : 'SALE'}</div>
      </div>

      {/* Body fields */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>STOCK</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: t.action === 'buy' ? 'var(--accent2)' : 'var(--accent3)' }}>{t.sym}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{t.company}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>AMOUNT</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: t.action === 'buy' ? 'var(--green)' : 'var(--red)' }}>{t.amount}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>TRADE DATE</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{t.date}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>DISCLOSED</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{t.disclosed}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>FILING LAG</div>
          <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: lagBg, color: lagColor, fontWeight: 500 }}>{t.lagDays} days</div>
        </div>
        {stockPrice && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>CURRENT PRICE</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>${stockPrice.toFixed(2)}</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        {t.notes}
      </div>
      {t.conflict && t.conflictReason && (
        <div style={{ marginTop: 8, fontSize: 11, padding: '8px 10px', background: 'rgba(255,107,74,0.06)', borderRadius: 6, border: '1px solid rgba(255,107,74,0.15)', color: 'var(--accent3)' }}>
          ⚠ {t.conflictReason}
        </div>
      )}
    </div>
  )
}

export default function PoliticiansTab({ stocks }) {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    let data = [...POL_TRADES]
    if (filter === 'buy') data = data.filter(t => t.action === 'buy')
    else if (filter === 'sell') data = data.filter(t => t.action === 'sell')
    else if (filter === 'senate') data = data.filter(t => t.chamber === 'Senate')
    else if (filter === 'house') data = data.filter(t => t.chamber === 'House')
    else if (filter === 'dem') data = data.filter(t => t.party === 'dem')
    else if (filter === 'rep') data = data.filter(t => t.party === 'rep')
    return data.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [filter])

  // Most active traders
  const traderCount = {}
  POL_TRADES.forEach(t => { traderCount[t.name] = (traderCount[t.name] || 0) + 1 })
  const topTraders = Object.entries(traderCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Most purchased stocks
  const buyCount = {}
  POL_TRADES.filter(t => t.action === 'buy').forEach(t => { buyCount[t.sym] = (buyCount[t.sym] || 0) + 1 })
  const topBuys = Object.entries(buyCount).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxBuy = topBuys[0]?.[1] || 1

  const conflicts = POL_TRADES.filter(t => t.conflict).slice(0, 4)

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'buy', label: 'Purchases' },
    { id: 'sell', label: 'Sales' },
    { id: 'senate', label: 'Senate' },
    { id: 'house', label: 'House' },
    { id: 'dem', label: 'Democrat' },
    { id: 'rep', label: 'Republican' },
  ]

  return (
    <div className="fade-in">
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 4 }}>
        Congressional Stock Trades
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
        Recent disclosed trades by US senators and representatives. Data sourced from mandatory STOCK Act filings. Lag = days between trade date and disclosure date.
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {filters.map(f => (
          <FiltBtn key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</FiltBtn>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
          📋 STOCK Act requires disclosure within 45 days
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Main list */}
        <div style={{ flex: 1 }}>
          {filtered.map((t, i) => (
            <TradeCard key={i} t={t} stockPrice={stocks.find(s => s.sym === t.sym)?.price} />
          ))}
        </div>

        {/* Sidebar */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Most Active */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 13, marginBottom: 14 }}>🏆 Most Active Traders</div>
            {topTraders.map(([name, count]) => {
              const pol = POL_TRADES.find(t => t.name === name)
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, flexShrink: 0,
                    background: pol.party === 'dem' ? 'rgba(100,149,237,0.2)' : 'rgba(255,99,71,0.2)',
                    color: pol.party === 'dem' ? '#6495ed' : '#ff6347',
                  }}>{initials(name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{pol.chamber} · {pol.party === 'dem' ? 'Dem' : 'Rep'}</div>
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{count}</div>
                </div>
              )
            })}
          </div>

          {/* Most Purchased */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Most Purchased Stocks</div>
            {topBuys.map(([sym, count]) => (
              <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--accent)', minWidth: 48 }}>{sym}</div>
                <div style={{ flex: 1, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / maxBuy) * 100}%`, background: 'var(--accent2)', borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', minWidth: 20, textAlign: 'right' }}>{count}x</div>
              </div>
            ))}
          </div>

          {/* Conflict Watch */}
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,107,74,0.2)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 13, marginBottom: 6, color: 'var(--accent3)' }}>⚠ Conflict Watch</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 12 }}>
              Politicians who sit on committees overseeing industries they trade in.
            </div>
            {conflicts.map((t, i) => (
              <div key={i} style={{ marginBottom: 12, padding: 10, background: 'rgba(255,107,74,0.06)', borderRadius: 6, border: '1px solid rgba(255,107,74,0.15)' }}>
                <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 3 }}>{t.name} — {t.sym} {t.action.toUpperCase()}</div>
                <div style={{ fontSize: 10, color: 'var(--accent3)', lineHeight: 1.5 }}>{t.conflictReason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
